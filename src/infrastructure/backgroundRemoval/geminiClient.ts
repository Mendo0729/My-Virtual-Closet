export interface GeminiGarmentSegmentation {
  box_2d: [number, number, number, number]
  mask: Array<[number, number]>
  label: string
}

export interface GeminiSegmentationResult {
  segmentation: GeminiGarmentSegmentation
  model: string
  latencyMs: number
}

const REQUEST_TIMEOUT_MS = 35_000
const MAX_ANALYSIS_DIMENSION = 640
const ANALYSIS_JPEG_QUALITY = 0.78

const segmentationCache = new WeakMap<Blob, Promise<GeminiSegmentationResult>>()

function loadImage(source: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(source)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo preparar la imagen para Gemini.'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo comprimir la imagen para Gemini.'))
        }
      },
      'image/jpeg',
      ANALYSIS_JPEG_QUALITY,
    )
  })
}

async function prepareAnalysisImage(source: Blob) {
  const image = await loadImage(source)
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = largestSide > MAX_ANALYSIS_DIMENSION
    ? MAX_ANALYSIS_DIMENSION / largestSide
    : 1

  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('El navegador no pudo preparar la imagen para Gemini.')
  }

  context.drawImage(image, 0, 0, width, height)
  return canvasToBlob(canvas)
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('No se pudo codificar la imagen para Gemini.'))
      }
    }

    reader.onerror = () => reject(new Error('No se pudo leer la imagen para Gemini.'))
    reader.readAsDataURL(blob)
  })
}

async function requestGeminiSegmentation(source: Blob): Promise<GeminiSegmentationResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const analysisImage = await prepareAnalysisImage(source)
    const image = await blobToDataUrl(analysisImage)

    const response = await fetch('/ai/segment-garment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null) as
      | (GeminiSegmentationResult & { error?: string })
      | null

    if (!response.ok) {
      throw new Error(payload?.error || `Gemini respondió HTTP ${response.status}.`)
    }

    if (!payload?.segmentation?.box_2d || !Array.isArray(payload.segmentation.mask)) {
      throw new Error('Gemini devolvió una respuesta de segmentación incompleta.')
    }

    return payload
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Gemini tardó demasiado en segmentar la prenda.')
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

/**
 * Reuses the semantic segmentation while the same Blob is selected. This
 * avoids another Gemini request when the user presses "Recortar de nuevo".
 * Failed requests are never cached.
 */
export function segmentGarmentWithGemini(source: Blob): Promise<GeminiSegmentationResult> {
  const cached = segmentationCache.get(source)
  if (cached) {
    return cached
  }

  const request = requestGeminiSegmentation(source).catch((error) => {
    segmentationCache.delete(source)
    throw error
  })

  segmentationCache.set(source, request)
  return request
}
