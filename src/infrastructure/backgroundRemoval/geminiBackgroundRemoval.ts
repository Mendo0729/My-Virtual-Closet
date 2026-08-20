import { removeGarmentBackground } from '../storage/imageProcessor'
import { segmentGarmentWithGemini } from './geminiClient'
import type {
  GeminiGarmentSegmentation,
  GeminiSegmentationResult,
} from './geminiClient'
import {
  prepareGeminiGuidedSource,
  refineGeminiGuidedResult,
} from './geminiMaskProcessor'

export const BACKGROUND_REMOVAL_MODEL = 'Gemini 3.6 Flash + recorte local guiado'

export async function analyzeGarmentForCutout(source: Blob): Promise<GeminiSegmentationResult> {
  const result = await segmentGarmentWithGemini(source)

  console.info(
    `[background-removal] Gemini map ready model=${result.model} latency=${result.latencyMs}ms label=${result.segmentation.label} maskPoints=${result.segmentation.mask.length}`,
  )

  return result
}

export async function removeGarmentBackgroundFromMap(
  source: Blob,
  segmentation: GeminiGarmentSegmentation,
): Promise<Blob> {
  const guided = await prepareGeminiGuidedSource(source, segmentation)

  // Gemini has already mapped the garment. From this point forward there are
  // no API calls: the classical local processor calculates the real boundary.
  const localResult = await removeGarmentBackground(guided.source)

  // The saved Gemini map is reused only as semantic context to discard
  // detached non-garment objects and clean tiny alpha spikes.
  return refineGeminiGuidedResult(localResult, guided.guide)
}

// Compatibility helper for any caller that still wants the old one-shot flow.
// The Add Garment screen now analyzes once when the image is selected and then
// calls removeGarmentBackgroundFromMap without contacting Gemini again.
export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const result = await analyzeGarmentForCutout(source)
  return removeGarmentBackgroundFromMap(source, result.segmentation)
}
