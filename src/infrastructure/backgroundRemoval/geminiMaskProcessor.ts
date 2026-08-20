import type { GeminiGarmentSegmentation } from './geminiClient'

const GEMINI_COORDINATE_SCALE = 1000
const CROP_PADDING_RATIO = 0.18
const MINIMUM_PADDING = 45
const GUIDED_SOURCE_QUALITY = 0.92

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
      reject(new Error('No se pudo leer la imagen para aplicar la guía de Gemini.'))
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
          reject(new Error('No se pudo preparar la imagen guiada por Gemini.'))
        }
      },
      'image/webp',
      GUIDED_SOURCE_QUALITY,
    )
  })
}

function clamp1000(value: number) {
  return Math.max(0, Math.min(GEMINI_COORDINATE_SCALE, value))
}

function fullImageMaskPoint(
  point: [number, number],
  box: [number, number, number, number],
) {
  const [ymin, xmin, ymax, xmax] = box.map(clamp1000) as [number, number, number, number]
  const [maskX, maskY] = point.map(clamp1000) as [number, number]

  return {
    x: xmin + (maskX / GEMINI_COORDINATE_SCALE) * (xmax - xmin),
    y: ymin + (maskY / GEMINI_COORDINATE_SCALE) * (ymax - ymin),
  }
}

/**
 * Gemini does not perform the final cutout here.
 *
 * Its semantic segmentation is used only to locate the garment and build a
 * smaller, background-rich region of interest. The classical local algorithm
 * receives this region afterwards and is responsible for calculating the
 * actual alpha mask and final garment edges.
 */
export async function prepareGeminiGuidedSource(
  source: Blob,
  segmentation: GeminiGarmentSegmentation,
): Promise<Blob> {
  const image = await loadImage(source)
  const imageWidth = image.naturalWidth
  const imageHeight = image.naturalHeight

  const [rawYmin, rawXmin, rawYmax, rawXmax] = segmentation.box_2d.map(clamp1000)

  if (rawXmax <= rawXmin || rawYmax <= rawYmin) {
    throw new Error('Gemini devolvió una región inválida para la prenda.')
  }

  // The bounding box is the primary semantic hint. The polygon is only used
  // to ensure that every area Gemini considered part of the garment remains
  // inside the local algorithm's working region. It is never used as alpha.
  let x1 = rawXmin
  let y1 = rawYmin
  let x2 = rawXmax
  let y2 = rawYmax

  if (Array.isArray(segmentation.mask) && segmentation.mask.length >= 3) {
    for (const point of segmentation.mask) {
      const fullPoint = fullImageMaskPoint(point, segmentation.box_2d)
      x1 = Math.min(x1, fullPoint.x)
      y1 = Math.min(y1, fullPoint.y)
      x2 = Math.max(x2, fullPoint.x)
      y2 = Math.max(y2, fullPoint.y)
    }
  }

  const garmentWidth = Math.max(1, x2 - x1)
  const garmentHeight = Math.max(1, y2 - y1)

  // A generous border is intentional. The local algorithm models the
  // background from the crop borders/corners, so an overly tight crop would
  // make the garment itself look like background.
  const paddingX = Math.max(MINIMUM_PADDING, garmentWidth * CROP_PADDING_RATIO)
  const paddingY = Math.max(MINIMUM_PADDING, garmentHeight * CROP_PADDING_RATIO)

  const cropX1 = Math.max(0, x1 - paddingX)
  const cropY1 = Math.max(0, y1 - paddingY)
  const cropX2 = Math.min(GEMINI_COORDINATE_SCALE, x2 + paddingX)
  const cropY2 = Math.min(GEMINI_COORDINATE_SCALE, y2 + paddingY)

  const sourceX = Math.max(0, Math.floor((cropX1 / GEMINI_COORDINATE_SCALE) * imageWidth))
  const sourceY = Math.max(0, Math.floor((cropY1 / GEMINI_COORDINATE_SCALE) * imageHeight))
  const sourceRight = Math.min(
    imageWidth,
    Math.ceil((cropX2 / GEMINI_COORDINATE_SCALE) * imageWidth),
  )
  const sourceBottom = Math.min(
    imageHeight,
    Math.ceil((cropY2 / GEMINI_COORDINATE_SCALE) * imageHeight),
  )

  const sourceWidth = Math.max(1, sourceRight - sourceX)
  const sourceHeight = Math.max(1, sourceBottom - sourceY)

  const canvas = document.createElement('canvas')
  canvas.width = sourceWidth
  canvas.height = sourceHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('El navegador no pudo preparar la región guiada por Gemini.')
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

  return canvasToBlob(canvas)
}
