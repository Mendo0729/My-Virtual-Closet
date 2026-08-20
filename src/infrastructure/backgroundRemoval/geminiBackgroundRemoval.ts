import { removeGarmentBackground } from '../storage/imageProcessor'
import { segmentGarmentWithGemini } from './geminiClient'
import {
  prepareGeminiGuidedSource,
  refineGeminiGuidedResult,
} from './geminiMaskProcessor'

export const BACKGROUND_REMOVAL_MODEL = 'Gemini 3.6 Flash + recorte local guiado'

export async function removeGarmentBackgroundWithAi(source: Blob): Promise<Blob> {
  const totalStartedAt = performance.now()
  const result = await segmentGarmentWithGemini(source)

  const localStartedAt = performance.now()
  const guided = await prepareGeminiGuidedSource(source, result.segmentation)

  // Gemini supplies semantic context; the classical local processor still
  // calculates the actual garment/background boundary.
  const localResult = await removeGarmentBackground(guided.source)

  // Gemini is used only as a generous semantic envelope for removing unrelated
  // pixels and detached objects. Its polygon never becomes the final edge.
  const finalResult = await refineGeminiGuidedResult(localResult, guided.guide)
  const localMs = Math.round(performance.now() - localStartedAt)
  const totalMs = Math.round(performance.now() - totalStartedAt)

  console.info(
    `[background-removal] model=${result.model} gemini=${result.latencyMs}ms local=${localMs}ms total=${totalMs}ms label=${result.segmentation.label} maskPoints=${result.segmentation.mask.length}`,
  )

  return finalResult
}
