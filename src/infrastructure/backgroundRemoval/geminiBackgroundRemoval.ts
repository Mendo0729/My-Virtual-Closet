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

export const BACKGROUND_REMOVAL_MODEL = 'Qwen 3.7 Flash / Gemini 3.6 Flash + recorte local guiado'

export async function analyzeGarmentForCutout(source: Blob): Promise<GeminiSegmentationResult> {
  const result = await segmentGarmentWithGemini(source)
  const foregroundPoints = result.segmentation.foreground_points?.length ?? 0
  const backgroundPoints = result.segmentation.background_points?.length ?? 0

  console.info(
    `[background-removal] AI map ready provider=${result.provider ?? 'unknown'} model=${result.model} latency=${result.latencyMs}ms label=${result.segmentation.label} maskPoints=${result.segmentation.mask.length} fg=${foregroundPoints} bg=${backgroundPoints}${typeof result.costUsd === 'number' ? ` costUsd=${result.costUsd}` : ''}`,
  )

  return result
}

export async function removeGarmentBackgroundFromMap(
  source: Blob,
  segmentation: GeminiGarmentSegmentation,
): Promise<Blob> {
  const guided = await prepareGeminiGuidedSource(source, segmentation)

  // The remote model has only mapped the garment. From this point forward
  // there are no API calls: the classical local processor calculates the real
  // pixel boundary and alpha channel from the source image.
  const localResult = await removeGarmentBackground(guided.source)

  // Reuse polygon plus foreground/background anchors only as semantic context
  // to preserve garment components and discard detached non-garment regions.
  return refineGeminiGuidedResult(localResult, guided.guide)
}

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const result = await analyzeGarmentForCutout(source)
  return removeGarmentBackgroundFromMap(source, result.segmentation)
}
