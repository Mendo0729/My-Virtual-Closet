import { segmentGarmentWithGemini } from './geminiClient'
import { applyGeminiGarmentMask } from './geminiMaskProcessor'

export const BACKGROUND_REMOVAL_MODEL = 'Gemini 3.6 Flash'

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const result = await segmentGarmentWithGemini(source)

  console.info(
    `[background-removal] Gemini model=${result.model} latency=${result.latencyMs}ms label=${result.segmentation.label} maskPoints=${result.segmentation.mask.length}`,
  )

  return applyGeminiGarmentMask(source, result.segmentation)
}
