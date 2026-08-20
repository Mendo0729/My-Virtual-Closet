import { removeGarmentBackground } from '../storage/imageProcessor'
import { segmentGarmentWithGemini } from './geminiClient'
import {
  prepareGeminiGuidedSource,
  refineGeminiGuidedResult,
} from './geminiMaskProcessor'

export const BACKGROUND_REMOVAL_MODEL = 'Gemini 3.6 Flash + recorte local guiado'

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const result = await segmentGarmentWithGemini(source)

  console.info(
    `[background-removal] Gemini guide model=${result.model} latency=${result.latencyMs}ms label=${result.segmentation.label} maskPoints=${result.segmentation.mask.length}`,
  )

  const guided = await prepareGeminiGuidedSource(source, result.segmentation)

  // Gemini supplies semantic context; the classical local processor still
  // calculates the actual garment/background boundary.
  const localResult = await removeGarmentBackground(guided.source)

  // Gemini is used again only to discard detached objects that the local
  // algorithm preserved (hanger, hooks, isolated shadows/specks) and to clean
  // tiny alpha spikes. Its polygon never becomes the final garment contour.
  return refineGeminiGuidedResult(localResult, guided.guide)
}
