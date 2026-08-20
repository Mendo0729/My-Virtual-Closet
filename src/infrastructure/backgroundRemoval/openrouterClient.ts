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
    const image = await blobToDataUrl(source)
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
