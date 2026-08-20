import { removeGarmentBackground } from '../storage/imageProcessor'
import { segmentGarmentWithGemini } from './geminiClient'
import { prepareGeminiGuidedSource } from './geminiMaskProcessor'

export const BACKGROUND_REMOVAL_MODEL = 'Gemini 3.6 Flash + recorte local'

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const result = await segmentGarmentWithGemini(source)

  console.info(
    `[background-removal] Gemini guide model=${result.model} latency=${result.latencyMs}ms label=${result.segmentation.label} maskPoints=${result.segmentation.mask.length}`,
  )

  const guidedSource = await prepareGeminiGuidedSource(source, result.segmentation)

  // Gemini only tells us where the garment is. The local image processor is
  // the component that calculates the actual background mask and final edges.
  return removeGarmentBackground(guidedSource)
}
