import { removeGarmentBackgroundGuided } from './guidedImageProcessor'
import { analyzeGarmentWithOpenRouter } from './openrouterClient'

export const BACKGROUND_REMOVAL_MODEL = 'OpenRouter · Gemma 4'

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const result = await analyzeGarmentWithOpenRouter(source)

  if (!result.analysis.garmentPresent) {
    throw new Error('OpenRouter no encontró una prenda clara en la imagen.')
  }

  console.info(
    `[background-removal] OpenRouter model=${result.model} latency=${result.latencyMs}ms confidence=${result.analysis.confidence.toFixed(2)}`,
  )

  return removeGarmentBackgroundGuided(source, result.analysis)
}
