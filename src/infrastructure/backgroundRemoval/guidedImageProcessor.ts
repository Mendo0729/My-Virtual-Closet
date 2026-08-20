import type { GarmentSegmentationGuidance } from './openrouterClient'
import { removeGarmentBackground } from '../storage/imageProcessor'

const BOUNDING_BOX_PADDING_RATIO = 0.09
const MINIMUM_PADDING_RATIO = 0.035
const GUIDED_CROP_QUALITY = 0.92

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
      reject(new Error('No se pudo leer la imagen para aplicar la guía de OpenRouter.'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo preparar el recorte guiado.'))
        }
      },
      'image/webp',
      GUIDED_CROP_QUALITY,
    )
  })
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

function guidedRegion(guidance: GarmentSegmentationGuidance) {
  const box = guidance.boundingBox
  const foreground = guidance.foregroundPoints

  let x1 = box.x1
  let y1 = box.y1
  let x2 = box.x2
  let y2 = box.y2

  for (const point of foreground) {
    x1 = Math.min(x1, point.x)
    y1 = Math.min(y1, point.y)
    x2 = Math.max(x2, point.x)
    y2 = Math.max(y2, point.y)
  }

  const boxWidth = Math.max(0.01, x2 - x1)
  const boxHeight = Math.max(0.01, y2 - y1)
  const paddingX = Math.max(MINIMUM_PADDING_RATIO, boxWidth * BOUNDING_BOX_PADDING_RATIO)
  const paddingY = Math.max(MINIMUM_PADDING_RATIO, boxHeight * BOUNDING_BOX_PADDING_RATIO)

  return {
    x1: clamp(x1 - paddingX),
    y1: clamp(y1 - paddingY),
    x2: clamp(x2 + paddingX),
    y2: clamp(y2 + paddingY),
  }
}

export async function removeGarmentBackgroundGuided(
  source: Blob,
  guidance: GarmentSegmentationGuidance,
): Promise<Blob> {
  if (!guidance.garmentPresent) {
    throw new Error('OpenRouter no encontró una prenda clara en la imagen.')
  }

  const image = await loadImage(source)
  const region = guidedRegion(guidance)

  const sourceX = Math.max(0, Math.floor(region.x1 * image.naturalWidth))
  const sourceY = Math.max(0, Math.floor(region.y1 * image.naturalHeight))
  const sourceRight = Math.min(image.naturalWidth, Math.ceil(region.x2 * image.naturalWidth))
  const sourceBottom = Math.min(image.naturalHeight, Math.ceil(region.y2 * image.naturalHeight))
  const sourceWidth = Math.max(1, sourceRight - sourceX)
  const sourceHeight = Math.max(1, sourceBottom - sourceY)

  const canvas = document.createElement('canvas')
  canvas.width = sourceWidth
  canvas.height = sourceHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('El navegador no pudo preparar el recorte guiado.')
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  )

  const croppedSource = await canvasToBlob(canvas)
  return removeGarmentBackground(croppedSource)
}
