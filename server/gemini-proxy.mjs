import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash'
const MAX_BODY_BYTES = 8 * 1024 * 1024
const GEMINI_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 2

const prompt = `Segment ONLY the main clothing garment that the user wants to save in a virtual closet.
Return a segmentation mask for the complete garment.

Important rules:
- Include the full garment and all thin parts such as sleeves, straps, laces, heels, handles, cuffs and collars.
- Exclude the person, hands, hanger, furniture, wall, floor, shadows and all background objects.
- If several objects are visible, select the single most prominent wearable garment.
- box_2d must be [ymin, xmin, ymax, xmax] normalized from 0 to 1000.
- mask must be the garment contour as [x, y] polygon coordinates normalized from 0 to 1000 INSIDE the bounding box.
- Return one result whenever a clear garment is visible.
- Use a short descriptive label.`

const responseSchema = {
  type: 'object',
  properties: {
    boxes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          box_2d: {
            type: 'array',
            items: { type: 'integer' },
          },
          mask: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'integer' },
            },
          },
          label: { type: 'string' },
        },
        required: ['box_2d', 'mask', 'label'],
      },
    },
  },
  required: ['boxes'],
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

  return {
    mimeType: match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase(),
    data: match[2],
  }
}

function clamp1000(value) {
  return Math.max(0, Math.min(1000, Math.round(Number(value))))
}

function sanitizeSegmentation(box) {
  if (!box || !Array.isArray(box.box_2d) || box.box_2d.length !== 4) {
    throw new Error('Gemini devolvió una caja de segmentación inválida.')
  }

  const box2d = box.box_2d.map(clamp1000)
  const [ymin, xmin, ymax, xmax] = box2d

  if (ymax <= ymin || xmax <= xmin) {
    throw new Error('Gemini devolvió una caja de segmentación vacía.')
  }

  if (!Array.isArray(box.mask) || box.mask.length < 3) {
    throw new Error('Gemini no devolvió un contorno suficiente para la prenda.')
  }

  const mask = box.mask
    .filter((point) => Array.isArray(point) && point.length >= 2)
    .map((point) => [clamp1000(point[0]), clamp1000(point[1])])

  if (mask.length < 3) {
    throw new Error('Gemini devolvió un contorno inválido.')
  }

  return {
    box_2d: box2d,
    mask,
    label: String(box.label || 'garment').slice(0, 80),
  }
}

function selectGarment(boxes) {
  if (!Array.isArray(boxes) || boxes.length === 0) {
    throw new Error('Gemini no encontró una prenda clara en la imagen.')
  }

  const candidates = []

  for (const box of boxes) {
    try {
      const segmentation = sanitizeSegmentation(box)
      const [ymin, xmin, ymax, xmax] = segmentation.box_2d
      candidates.push({
        segmentation,
        area: (ymax - ymin) * (xmax - xmin),
      })
    } catch {
      // Ignore malformed alternatives and keep looking for a valid garment.
    }
  }

  if (candidates.length === 0) {
    throw new Error('Gemini no devolvió una segmentación válida de la prenda.')
  }

  candidates.sort((left, right) => right.area - left.area)
  return candidates[0].segmentation
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const steps = Array.isArray(payload?.steps) ? payload.steps : []
  for (let stepIndex = steps.length - 1; stepIndex >= 0; stepIndex -= 1) {
    const step = steps[stepIndex]
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) {
      continue
    }

    const text = step.content
      .filter((part) => part?.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim()

    if (text) {
      return text
    }
  }

  return ''
}

function shouldRetry(status) {
  return status === 429 || status >= 500
}

async function callGemini(image) {
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)
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
            schema: responseSchema,
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
          const waitMs = attempt * 800
          console.warn(`[gemini-proxy] retrying attempt=${attempt + 1}/${MAX_ATTEMPTS} after=${waitMs}ms status=${response.status}`)
          await new Promise((resolve) => setTimeout(resolve, waitMs))
          continue
        }

        throw error
      }

      const payload = JSON.parse(raw)
      const outputText = extractOutputText(payload)

      if (!outputText) {
        throw new Error('Gemini no devolvió datos de segmentación.')
      }

      const parsed = JSON.parse(outputText)
      const segmentation = selectGarment(parsed.boxes)
      const latencyMs = Math.round(performance.now() - startedAt)

      console.log(
        `[gemini-proxy] success model=${payload.model || GEMINI_MODEL} latency=${latencyMs}ms label=${segmentation.label} maskPoints=${segmentation.mask.length}`,
      )

      return {
        segmentation,
        model: payload.model || GEMINI_MODEL,
        latencyMs,
      }
    } catch (error) {
      lastError = error
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new Error('Gemini tardó demasiado en responder.')
      }

      if (attempt < MAX_ATTEMPTS && !(lastError?.message || '').startsWith('Gemini respondió HTTP 4')) {
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

async function segmentWithGemini(imageDataUrl) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurada en el servidor.')
  }

  return callGemini(parseDataUrl(imageDataUrl))
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, {
      ok: true,
      provider: 'gemini',
      model: GEMINI_MODEL,
      configured: Boolean(GEMINI_API_KEY),
    })
    return
  }

  if (request.method !== 'POST' || request.url !== '/segment-garment') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  try {
    const body = JSON.parse(await readBody(request))
    const result = await segmentWithGemini(body?.image)
    sendJson(response, 200, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado.'
    const statusCode = message.includes('GEMINI_API_KEY') ? 503 : 502
    console.error('[gemini-proxy]', message)
    sendJson(response, statusCode, { error: message })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[gemini-proxy] listening on 0.0.0.0:${PORT}`)
  console.log(`[gemini-proxy] model=${GEMINI_MODEL}`)
})
