const DEFAULT_BACKGROUND_REMOVAL_MODEL = 'birefnet-general-lite'
const REQUEST_TIMEOUT_MS = 90_000

export const BACKGROUND_REMOVAL_MODEL =
  import.meta.env.VITE_BACKGROUND_REMOVAL_MODEL?.trim() || DEFAULT_BACKGROUND_REMOVAL_MODEL

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const formData = new FormData()

  formData.append('file', source, 'garment-image')
  formData.append('model', BACKGROUND_REMOVAL_MODEL)

  try {
    const response = await fetch('/rembg/api/remove', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`El servicio de recorte IA respondió con HTTP ${response.status}.`)
    }

    const result = await response.blob()

    if (result.size === 0 || !result.type.startsWith('image/')) {
      throw new Error('El servicio de recorte IA devolvió una respuesta inválida.')
    }

    return result
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('El recorte IA tardó demasiado en responder.')
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
