import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() || 'openrouter/free'
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL?.trim() || ''
const MAX_BODY_BYTES = 12 * 1024 * 1024
const OPENROUTER_TIMEOUT_MS = 30_000
const OPENROUTER_MAX_ATTEMPTS = 3

const prompt = `Analyze the main garment in this image for a background-removal algorithm.
Return ONLY one valid JSON object with exactly this shape:
{
  "garmentPresent": true,
  "category": "top|bottom|shoes|accessory|unknown",
  "suggestedName": "short garment name",
  "primaryColor": "main garment color",
  "confidence": 0.0,
  "boundingBox": { "x1": 0.0, "y1": 0.0, "x2": 1.0, "y2": 1.0 },
  "foregroundPoints": [{ "x": 0.0, "y": 0.0 }],
  "backgroundPoints": [{ "x": 0.0, "y": 0.0 }]
}

Rules:
- Coordinates are normalized from 0 to 1 relative to the full image.
- boundingBox must tightly contain the complete garment, including sleeves, straps, laces, heels, handles, and other thin parts.
- Return 5 to 8 foregroundPoints clearly inside different parts of the garment. Spread them across the object.
- Return 5 to 8 backgroundPoints clearly outside the garment and across different background regions.
- Never place a foreground point on a person, hand, hanger, chair, wall, floor, shadow, or another object.
- Never place a background point on the garment.
- If there is one obvious garment, garmentPresent must be true even if the background is complex.
- category must be top, bottom, shoes, accessory, or unknown.
- suggestedName and primaryColor must describe the garment, not the background.
- confidence is confidence in garment localization from 0 to 1.
- Do not include markdown, code fences, comments, or text outside the JSON object.`

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('La imagen es demasiado grande para analizarla.'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })

    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function sanitizePoint(point) {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return null
  }

  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  }
}

function sanitizeAnalysis(value) {
  const box = value?.boundingBox || {}
  const x1 = Math.max(0, Math.min(1, Number(box.x1)))
  const y1 = Math.max(0, Math.min(1, Number(box.y1)))
  const x2 = Math.max(0, Math.min(1, Number(box.x2)))
  const y2 = Math.max(0, Math.min(1, Number(box.y2)))

  if (![x1, y1, x2, y2].every(Number.isFinite) || x2 <= x1 || y2 <= y1) {
    throw new Error('OpenRouter devolvió una caja de recorte inválida.')
  }

  const foregroundPoints = Array.isArray(value?.foregroundPoints)
    ? value.foregroundPoints.map(sanitizePoint).filter(Boolean)
    : []
  const backgroundPoints = Array.isArray(value?.backgroundPoints)
    ? value.backgroundPoints.map(sanitizePoint).filter(Boolean)
    : []

  if (foregroundPoints.length < 3 || backgroundPoints.length < 3) {
    throw new Error('OpenRouter devolvió pocos puntos de guía.')
  }

  return {
    garmentPresent: Boolean(value.garmentPresent),
    category: ['top', 'bottom', 'shoes', 'accessory', 'unknown'].includes(value.category)
      ? value.category
      : 'unknown',
    suggestedName: String(value.suggestedName || '').slice(0, 80),
    primaryColor: String(value.primaryColor || '').slice(0, 40),
    confidence: Math.max(0, Math.min(1, Number(value.confidence) || 0)),
    boundingBox: { x1, y1, x2, y2 },
    foregroundPoints,
    backgroundPoints,
  }
}

function getMessageText(message) {
  const content = message?.content

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (typeof part?.text === 'string') return part.text
        return ''
      })
      .join('\n')
      .trim()
  }

  return ''
}

function parseJsonObject(text) {
  if (!text) {
    throw new Error('OpenRouter no devolvió análisis de la imagen.')
  }

  let normalized = text.trim()

  if (normalized.startsWith('```')) {
    normalized = normalized
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
  }

  try {
    return JSON.parse(normalized)
  } catch {
    const firstBrace = normalized.indexOf('{')
    const lastBrace = normalized.lastIndexOf('}')

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(normalized.slice(firstBrace, lastBrace + 1))
    }

    throw new Error('OpenRouter devolvió texto, pero no un JSON válido.')
  }
}

function compactDiagnostic(payload) {
  const choice = payload?.choices?.[0]
  const message = choice?.message || {}
  const reasoningTokens =
    payload?.usage?.completion_tokens_details?.reasoning_tokens ??
    payload?.usage?.completionTokensDetails?.reasoningTokens ??
    null

  return {
    model: payload?.model || OPENROUTER_MODEL,
    finishReason: choice?.finish_reason ?? null,
    contentType: Array.isArray(message.content) ? 'array' : typeof message.content,
    contentLength:
      typeof message.content === 'string'
        ? message.content.length
        : Array.isArray(message.content)
          ? message.content.length
          : 0,
    hasReasoning: Boolean(message.reasoning || message.reasoning_details),
    reasoningTokens,
  }
}

async function requestOpenRouter(imageDataUrl) {
  const headers = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Title': 'My Virtual Closet',
  }

  if (OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = OPENROUTER_SITE_URL
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
        provider: {
          allow_fallbacks: true,
        },
      }),
    })

    const raw = await response.text()

    if (!response.ok) {
      const error = new Error(`OpenRouter respondió HTTP ${response.status}: ${raw.slice(0, 300)}`)
      error.statusCode = response.status
      throw error
    }

    return JSON.parse(raw)
  } finally {
    clearTimeout(timeout)
  }
}

async function analyzeWithOpenRouter(imageDataUrl) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY no está configurada en el servidor.')
  }

  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageDataUrl)) {
    throw new Error('Formato de imagen no soportado.')
  }

  const startedAt = performance.now()
  let lastError

  for (let attempt = 1; attempt <= OPENROUTER_MAX_ATTEMPTS; attempt += 1) {
    try {
      const payload = await requestOpenRouter(imageDataUrl)
      const diagnostic = compactDiagnostic(payload)
      const message = payload?.choices?.[0]?.message
      const content = getMessageText(message)

      if (!content) {
        console.warn(
          `[openrouter-proxy] empty response attempt=${attempt}/${OPENROUTER_MAX_ATTEMPTS}`,
          diagnostic,
        )
        throw new Error('OpenRouter no devolvió análisis de la imagen.')
      }

      const parsed = parseJsonObject(content)
      const analysis = sanitizeAnalysis(parsed)
      const latencyMs = Math.round(performance.now() - startedAt)

      console.log(
        `[openrouter-proxy] success model=${diagnostic.model} latency=${latencyMs}ms finish=${diagnostic.finishReason ?? 'unknown'} attempt=${attempt}`,
      )

      return {
        analysis,
        model: diagnostic.model,
        latencyMs,
        usage: payload.usage || null,
      }
    } catch (error) {
      lastError = error
      const statusCode = error?.statusCode
      const retryable =
        attempt < OPENROUTER_MAX_ATTEMPTS &&
        (statusCode === 429 ||
          (typeof statusCode === 'number' && statusCode >= 500) ||
          !statusCode)

      if (!retryable) {
        throw error
      }

      const delayMs = 750 * 2 ** (attempt - 1)
      console.warn(
        `[openrouter-proxy] retrying attempt=${attempt + 1}/${OPENROUTER_MAX_ATTEMPTS} after=${delayMs}ms reason=${error instanceof Error ? error.message : 'unknown'}`,
      )
      await wait(delayMs)
    }
  }

  throw lastError || new Error('OpenRouter no pudo analizar la imagen.')
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, {
      ok: true,
      provider: 'openrouter',
      model: OPENROUTER_MODEL,
      configured: Boolean(OPENROUTER_API_KEY),
    })
    return
  }

  if (request.method !== 'POST' || request.url !== '/analyze-garment') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  try {
    const body = JSON.parse(await readBody(request))
    const imageDataUrl = body?.image

    if (typeof imageDataUrl !== 'string') {
      sendJson(response, 400, { error: 'Falta la imagen.' })
      return
    }

    const result = await analyzeWithOpenRouter(imageDataUrl)
    sendJson(response, 200, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado.'
    const statusCode = message.includes('OPENROUTER_API_KEY') ? 503 : 502
    console.error('[openrouter-proxy]', message)
    sendJson(response, statusCode, { error: message })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[openrouter-proxy] listening on 0.0.0.0:${PORT}`)
  console.log(`[openrouter-proxy] model=${OPENROUTER_MODEL}`)
})
