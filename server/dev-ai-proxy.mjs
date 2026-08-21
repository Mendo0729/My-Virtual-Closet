import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() || 'qwen/qwen3.7-flash'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash'
const MAX_BODY_BYTES = 8 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 2

const prompt = `Analyze the image and locate ONLY the main clothing garment the user wants to save in a virtual closet.
You are NOT removing the background and you are NOT generating an edited image. Your job is to return spatial guidance for a local segmentation algorithm.

Return:
- box_2d: [ymin, xmin, ymax, xmax] for the garment, normalized from 0 to 1000 over the FULL image.
- mask: an ordered polygon around the garment, as [x, y] points normalized from 0 to 1000 INSIDE box_2d. Use enough points to follow sleeves, collars, straps, handles, heels, laces and curved edges. Prefer 20-60 useful contour points instead of a coarse rectangle.
- foreground_points: several [x, y] points normalized from 0 to 1000 over the FULL image that are definitely part of the garment. Spread them across separate garment regions when possible.
- background_points: several [x, y] points normalized from 0 to 1000 over the FULL image that are definitely background. Include useful nearby background and internal holes such as between trouser legs, inside handles or neck openings when clearly visible.
- confidence: confidence from 0 to 1 that the selected object and map correspond to one clear garment.
- label: a short garment description.

Rules:
- Include the complete garment and thin garment parts.
- Exclude people, hands, hangers, furniture, walls, floors, shadows and unrelated objects.
- If several objects are visible, select the single most prominent wearable garment.
- Do not invent hidden garment geometry.
- Do not return prose outside the requested JSON.`

const pointSchema = {
  type: 'array',
  minItems: 2,
  maxItems: 2,
  items: {
    type: 'integer',
    minimum: 0,
    maximum: 1000,
  },
}

const segmentationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    box_2d: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
      },
      description: '[ymin, xmin, ymax, xmax] over the full image, normalized 0-1000.',
    },
    mask: {
      type: 'array',
      minItems: 8,
      maxItems: 80,
      items: pointSchema,
      description: 'Ordered garment contour points [x,y], normalized 0-1000 inside box_2d.',
    },
    foreground_points: {
      type: 'array',
      minItems: 3,
      maxItems: 16,
      items: pointSchema,
      description: 'Definitely-garment [x,y] points over the full image, normalized 0-1000.',
    },
    background_points: {
      type: 'array',
      minItems: 4,
      maxItems: 20,
      items: pointSchema,
      description: 'Definitely-background [x,y] points over the full image, normalized 0-1000.',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    label: {
      type: 'string',
      maxLength: 80,
    },
  },
  required: [
    'box_2d',
    'mask',
    'foreground_points',
    'background_points',
    'confidence',
    'label',
  ],
}

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

function parseDataUrl(value) {
  if (typeof value !== 'string') {
    throw new Error('Falta la imagen.')
  }

  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i)
  if (!match) {
    throw new Error('Formato de imagen no soportado.')
  }

  const mimeType = match[1].toLowerCase() === 'image/jpg'
    ? 'image/jpeg'
    : match[1].toLowerCase()

  return {
    dataUrl: `data:${mimeType};base64,${match[2]}`,
    mimeType,
    data: match[2],
  }
}

function clamp1000(value) {
  return Math.max(0, Math.min(1000, Math.round(Number(value))))
}

function sanitizePointList(value) {
  if (!Array.isArray(value)) return []

  return value
    .filter((point) => Array.isArray(point) && point.length >= 2)
    .map((point) => [clamp1000(point[0]), clamp1000(point[1])])
}

function sanitizeSegmentation(raw) {
  if (!raw || !Array.isArray(raw.box_2d) || raw.box_2d.length !== 4) {
    throw new Error('El modelo devolvió una caja de segmentación inválida.')
  }

  const box_2d = raw.box_2d.map(clamp1000)
  const [ymin, xmin, ymax, xmax] = box_2d

  if (ymax <= ymin || xmax <= xmin) {
    throw new Error('El modelo devolvió una caja de segmentación vacía.')
  }

  const mask = sanitizePointList(raw.mask)
  if (mask.length < 3) {
    throw new Error('El modelo no devolvió un contorno suficiente para la prenda.')
  }

  return {
    box_2d,
    mask,
    foreground_points: sanitizePointList(raw.foreground_points),
    background_points: sanitizePointList(raw.background_points),
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
    label: String(raw.label || 'garment').slice(0, 80),
  }
}

function extractOpenRouterText(payload) {
  const content = payload?.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .filter((part) => part?.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim()
  }

  return ''
}

function extractGeminiOutputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const steps = Array.isArray(payload?.steps) ? payload.steps : []
  for (let stepIndex = steps.length - 1; stepIndex >= 0; stepIndex -= 1) {
    const step = steps[stepIndex]
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) continue

    const text = step.content
      .filter((part) => part?.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim()

    if (text) return text
  }

  return ''
}

function shouldRetry(status) {
  return status >= 500
}

async function callQwen(image) {
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const startedAt = performance.now()

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://closet.mendotech.lat',
          'X-Title': 'My Virtual Closet Dev Segmentation',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: image.dataUrl },
                },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'garment_segmentation',
              strict: true,
              schema: segmentationSchema,
            },
          },
          provider: {
            require_parameters: true,
          },
          temperature: 0,
          max_tokens: 1800,
          stream: false,
        }),
      })

      const raw = await response.text()

      if (!response.ok) {
        const error = new Error(`Qwen/OpenRouter respondió HTTP ${response.status}: ${raw.slice(0, 500)}`)
        lastError = error

        if (attempt < MAX_ATTEMPTS && shouldRetry(response.status)) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 800))
          continue
        }

        throw error
      }

      const payload = JSON.parse(raw)
      const outputText = extractOpenRouterText(payload)
      if (!outputText) {
        throw new Error('Qwen no devolvió datos de segmentación.')
      }

      const segmentation = sanitizeSegmentation(JSON.parse(outputText))
      const latencyMs = Math.round(performance.now() - startedAt)
      const costUsd = Number(payload?.usage?.cost)

      console.log(
        `[dev-ai-proxy] success provider=openrouter model=${payload.model || OPENROUTER_MODEL} latency=${latencyMs}ms label=${segmentation.label} maskPoints=${segmentation.mask.length} fg=${segmentation.foreground_points.length} bg=${segmentation.background_points.length}${Number.isFinite(costUsd) ? ` costUsd=${costUsd}` : ''}`,
      )

      return {
        segmentation,
        provider: 'openrouter',
        model: payload.model || OPENROUTER_MODEL,
        latencyMs,
        ...(Number.isFinite(costUsd) ? { costUsd } : {}),
      }
    } catch (error) {
      lastError = error
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new Error('Qwen tardó demasiado en responder.')
      }

      const message = lastError instanceof Error ? lastError.message : ''
      if (attempt < MAX_ATTEMPTS && !message.startsWith('Qwen/OpenRouter respondió HTTP 4')) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 800))
        continue
      }

      throw lastError
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error('Qwen no pudo analizar la imagen.')
}

async function callGemini(image) {
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const startedAt = performance.now()

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              data: image.data,
              mime_type: image.mimeType,
            },
          ],
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: segmentationSchema,
          },
          generation_config: {
            thinking_level: 'minimal',
          },
        }),
      })

      const raw = await response.text()

      if (!response.ok) {
        const error = new Error(`Gemini respondió HTTP ${response.status}: ${raw.slice(0, 500)}`)
        lastError = error

        if (attempt < MAX_ATTEMPTS && shouldRetry(response.status)) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 800))
          continue
        }

        throw error
      }

      const payload = JSON.parse(raw)
      const outputText = extractGeminiOutputText(payload)
      if (!outputText) {
        throw new Error('Gemini no devolvió datos de segmentación.')
      }

      const segmentation = sanitizeSegmentation(JSON.parse(outputText))
      const latencyMs = Math.round(performance.now() - startedAt)

      console.log(
        `[dev-ai-proxy] success provider=gemini model=${payload.model || GEMINI_MODEL} latency=${latencyMs}ms label=${segmentation.label} maskPoints=${segmentation.mask.length} fg=${segmentation.foreground_points.length} bg=${segmentation.background_points.length}`,
      )

      return {
        segmentation,
        provider: 'gemini',
        model: payload.model || GEMINI_MODEL,
        latencyMs,
      }
    } catch (error) {
      lastError = error
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new Error('Gemini tardó demasiado en responder.')
      }

      const message = lastError instanceof Error ? lastError.message : ''
      if (attempt < MAX_ATTEMPTS && !message.startsWith('Gemini respondió HTTP 4')) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 800))
        continue
      }

      throw lastError
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error('Gemini no pudo analizar la imagen.')
}

async function segmentGarment(imageDataUrl) {
  const image = parseDataUrl(imageDataUrl)
  const failures = []

  if (OPENROUTER_API_KEY) {
    try {
      return await callQwen(image)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido de Qwen.'
      failures.push(`Qwen: ${message}`)
      console.warn(`[dev-ai-proxy] Qwen failed; trying Gemini fallback. ${message}`)
    }
  }

  if (GEMINI_API_KEY) {
    try {
      return await callGemini(image)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido de Gemini.'
      failures.push(`Gemini: ${message}`)
      console.warn(`[dev-ai-proxy] Gemini fallback failed. ${message}`)
    }
  }

  if (!OPENROUTER_API_KEY && !GEMINI_API_KEY) {
    throw new Error('No hay ningún proveedor de IA configurado en desarrollo.')
  }

  throw new Error(`No se pudo crear el mapa de la prenda. ${failures.join(' | ')}`)
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, {
      ok: true,
      primary: 'openrouter',
      fallback: 'gemini',
      providers: {
        openrouter: {
          model: OPENROUTER_MODEL,
          configured: Boolean(OPENROUTER_API_KEY),
        },
        gemini: {
          model: GEMINI_MODEL,
          configured: Boolean(GEMINI_API_KEY),
        },
      },
      configured: Boolean(OPENROUTER_API_KEY || GEMINI_API_KEY),
    })
    return
  }

  if (request.method !== 'POST' || request.url !== '/segment-garment') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  try {
    const body = JSON.parse(await readBody(request))
    const result = await segmentGarment(body?.image)
    sendJson(response, 200, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado.'
    const statusCode = message.includes('configurado') ? 503 : 502
    console.error('[dev-ai-proxy]', message)
    sendJson(response, statusCode, { error: message })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[dev-ai-proxy] listening on 0.0.0.0:${PORT}`)
  console.log(`[dev-ai-proxy] primary=${OPENROUTER_MODEL} configured=${Boolean(OPENROUTER_API_KEY)}`)
  console.log(`[dev-ai-proxy] fallback=${GEMINI_MODEL} configured=${Boolean(GEMINI_API_KEY)}`)
})
