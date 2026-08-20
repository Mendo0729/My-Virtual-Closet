export interface NormalizedPoint {
  x: number
  y: number
}

export interface NormalizedBoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface GarmentSegmentationGuidance {
  garmentPresent: boolean
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'unknown'
  suggestedName: string
  primaryColor: string
  confidence: number
  boundingBox: NormalizedBoundingBox
  foregroundPoints: NormalizedPoint[]
  backgroundPoints: NormalizedPoint[]
}

export interface GarmentAnalysisResult {
  analysis: GarmentSegmentationGuidance
  model: string
  latencyMs: number
}

const REQUEST_TIMEOUT_MS = 35_000
const ANALYSIS_MAX_DIMENSION = 768
const ANALYSIS_WEBP_QUALITY = 0.8

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
      reject(new Error('No se pudo preparar la imagen para OpenRouter.'))
    }

    image.src = objectUrl
  })
}

function canvasToWebp(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo comprimir la imagen para OpenRouter.'))
        }
      },
      'image/webp',
      ANALYSIS_WEBP_QUALITY,
    )
  })
}

async function prepareAnalysisImage(source: Blob) {
  const image = await loadImage(source)
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight)

  if (largestSide <= ANALYSIS_MAX_DIMENSION && source.type === 'image/webp') {
    return source
  }

  const scale = Math.min(1, ANALYSIS_MAX_DIMENSION / Math.max(1, largestSide))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('El navegador no pudo preparar la imagen para OpenRouter.')
  }

  context.drawImage(image, 0, 0, width, height)
  return canvasToWebp(canvas)
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('No se pudo preparar la imagen para OpenRouter.'))
      }
    }

    reader.onerror = () => reject(new Error('No se pudo leer la imagen para OpenRouter.'))
    reader.readAsDataURL(blob)
  })
}

export async function analyzeGarmentWithOpenRouter(source: Blob): Promise<GarmentAnalysisResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const analysisImage = await prepareAnalysisImage(source)
    const image = await blobToDataUrl(analysisImage)
    const response = await fetch('/ai/analyze-garment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null) as
      | (GarmentAnalysisResult & { error?: string })
      | null

    if (!response.ok) {
      throw new Error(payload?.error || `OpenRouter respondió HTTP ${response.status}.`)
    }

    if (!payload?.analysis?.boundingBox) {
      throw new Error('OpenRouter devolvió una respuesta incompleta.')
    }

    return payload
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('OpenRouter tardó demasiado en analizar la imagen.')
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
