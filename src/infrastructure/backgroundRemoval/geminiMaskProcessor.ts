import type { GeminiGarmentSegmentation } from './geminiClient'

const GEMINI_COORDINATE_SCALE = 1000
const CROP_PADDING_RATIO = 0.05

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
      reject(new Error('No se pudo leer la imagen para aplicar la máscara de Gemini.'))
    }

    image.src = objectUrl
  })
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo generar la imagen transparente.'))
        }
      },
      'image/png',
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

export async function applyGeminiGarmentMask(
  source: Blob,
  segmentation: GeminiGarmentSegmentation,
): Promise<Blob> {
  if (!Array.isArray(segmentation.mask) || segmentation.mask.length < 3) {
    throw new Error('Gemini no devolvió un contorno válido para la prenda.')
  }

  const image = await loadImage(source)
  const width = image.naturalWidth
  const height = image.naturalHeight

  const imageCanvas = document.createElement('canvas')
  imageCanvas.width = width
  imageCanvas.height = height

  const imageContext = imageCanvas.getContext('2d')
  if (!imageContext) {
    throw new Error('El navegador no pudo preparar la máscara de Gemini.')
  }

  imageContext.drawImage(image, 0, 0, width, height)

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height

  const maskContext = maskCanvas.getContext('2d')
  if (!maskContext) {
    throw new Error('El navegador no pudo preparar el contorno de Gemini.')
  }

  const points = segmentation.mask.map((point) =>
    fullImageMaskPoint(point, segmentation.box_2d),
  )

  maskContext.fillStyle = '#ffffff'
  maskContext.beginPath()
  maskContext.moveTo(
    (points[0].x / GEMINI_COORDINATE_SCALE) * width,
    (points[0].y / GEMINI_COORDINATE_SCALE) * height,
  )

  for (let index = 1; index < points.length; index += 1) {
    maskContext.lineTo(
      (points[index].x / GEMINI_COORDINATE_SCALE) * width,
      (points[index].y / GEMINI_COORDINATE_SCALE) * height,
    )
  }

  maskContext.closePath()
  maskContext.fill()

  imageContext.globalCompositeOperation = 'destination-in'
  imageContext.drawImage(maskCanvas, 0, 0)
  imageContext.globalCompositeOperation = 'source-over'

  const [rawYmin, rawXmin, rawYmax, rawXmax] = segmentation.box_2d.map(clamp1000)
  const boxWidth = Math.max(1, rawXmax - rawXmin)
  const boxHeight = Math.max(1, rawYmax - rawYmin)
  const paddingX = Math.max(10, boxWidth * CROP_PADDING_RATIO)
  const paddingY = Math.max(10, boxHeight * CROP_PADDING_RATIO)

  const cropX1 = Math.max(0, rawXmin - paddingX)
  const cropY1 = Math.max(0, rawYmin - paddingY)
  const cropX2 = Math.min(GEMINI_COORDINATE_SCALE, rawXmax + paddingX)
  const cropY2 = Math.min(GEMINI_COORDINATE_SCALE, rawYmax + paddingY)

  const sourceX = Math.floor((cropX1 / GEMINI_COORDINATE_SCALE) * width)
  const sourceY = Math.floor((cropY1 / GEMINI_COORDINATE_SCALE) * height)
  const sourceRight = Math.ceil((cropX2 / GEMINI_COORDINATE_SCALE) * width)
  const sourceBottom = Math.ceil((cropY2 / GEMINI_COORDINATE_SCALE) * height)
  const sourceWidth = Math.max(1, sourceRight - sourceX)
  const sourceHeight = Math.max(1, sourceBottom - sourceY)

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = sourceWidth
  outputCanvas.height = sourceHeight

  const outputContext = outputCanvas.getContext('2d')
  if (!outputContext) {
    throw new Error('El navegador no pudo preparar el recorte final de Gemini.')
  }

  outputContext.drawImage(
    imageCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  )

  return canvasToPng(outputCanvas)
}
