import type { GeminiGarmentSegmentation } from './geminiClient'

const GEMINI_COORDINATE_SCALE = 1000
const CROP_PADDING_RATIO = 0.14
const MINIMUM_PADDING = 36
const COMPONENT_ALPHA_THRESHOLD = 96
const MAX_UNGUIDED_COMPONENT_RATIO = 0.12
const EDGE_CLEANUP_PASSES = 2
const GUIDE_ENVELOPE_RATIO = 0.04
const MIN_GUIDE_ENVELOPE_RADIUS = 10
const MAX_GUIDE_ENVELOPE_RADIUS = 34
const VISIBLE_ALPHA_THRESHOLD = 18
const OUTPUT_PADDING_RATIO = 0.035
const MIN_OUTPUT_PADDING = 10

export interface GeminiLocalGuide {
  polygon: Array<{ x: number; y: number }>
}

export interface GeminiGuidedSource {
  source: Blob
  guide: GeminiLocalGuide
}

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

function canvasToPng(canvas: HTMLCanvasElement, errorMessage: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error(errorMessage))
        }
      },
      'image/png',
    )
  })
}

function clamp1000(value: number) {
  return Math.max(0, Math.min(GEMINI_COORDINATE_SCALE, value))
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
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
 * Gemini only locates the garment. The crop keeps genuine background around
 * the object so the classical processor can calculate the real edge.
 */
export async function prepareGeminiGuidedSource(
  source: Blob,
  segmentation: GeminiGarmentSegmentation,
): Promise<GeminiGuidedSource> {
  const image = await loadImage(source)
  const imageWidth = image.naturalWidth
  const imageHeight = image.naturalHeight

  const [rawYmin, rawXmin, rawYmax, rawXmax] = segmentation.box_2d.map(clamp1000)

  if (rawXmax <= rawXmin || rawYmax <= rawYmin) {
    throw new Error('Gemini devolvió una región inválida para la prenda.')
  }

  let x1 = rawXmin
  let y1 = rawYmin
  let x2 = rawXmax
  let y2 = rawYmax
  const fullMaskPoints: Array<{ x: number; y: number }> = []

  if (Array.isArray(segmentation.mask) && segmentation.mask.length >= 3) {
    for (const point of segmentation.mask) {
      const fullPoint = fullImageMaskPoint(point, segmentation.box_2d)
      fullMaskPoints.push(fullPoint)
      x1 = Math.min(x1, fullPoint.x)
      y1 = Math.min(y1, fullPoint.y)
      x2 = Math.max(x2, fullPoint.x)
      y2 = Math.max(y2, fullPoint.y)
    }
  }

  const garmentWidth = Math.max(1, x2 - x1)
  const garmentHeight = Math.max(1, y2 - y1)
  const paddingX = Math.max(MINIMUM_PADDING, garmentWidth * CROP_PADDING_RATIO)
  const paddingY = Math.max(MINIMUM_PADDING, garmentHeight * CROP_PADDING_RATIO)

  const cropX1 = Math.max(0, x1 - paddingX)
  const cropY1 = Math.max(0, y1 - paddingY)
  const cropX2 = Math.min(GEMINI_COORDINATE_SCALE, x2 + paddingX)
  const cropY2 = Math.min(GEMINI_COORDINATE_SCALE, y2 + paddingY)
  const cropWidthNormalized = Math.max(1, cropX2 - cropX1)
  const cropHeightNormalized = Math.max(1, cropY2 - cropY1)

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

  const polygon = fullMaskPoints.map((point) => ({
    x: clamp01((point.x - cropX1) / cropWidthNormalized),
    y: clamp01((point.y - cropY1) / cropHeightNormalized),
  }))

  return {
    source: await canvasToPng(canvas, 'No se pudo preparar la imagen guiada por Gemini.'),
    guide: { polygon },
  }
}

function createGuideMask(
  width: number,
  height: number,
  guide: GeminiLocalGuide,
  envelopeRadius = 0,
) {
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height

  const context = maskCanvas.getContext('2d', { willReadFrequently: true })
  if (!context || guide.polygon.length < 3) {
    return new Uint8Array(width * height)
  }

  context.fillStyle = '#fff'
  context.strokeStyle = '#fff'
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(guide.polygon[0].x * width, guide.polygon[0].y * height)

  for (let index = 1; index < guide.polygon.length; index += 1) {
    context.lineTo(guide.polygon[index].x * width, guide.polygon[index].y * height)
  }

  context.closePath()
  context.fill()

  if (envelopeRadius > 0) {
    context.lineWidth = envelopeRadius * 2
    context.stroke()
  }

  const pixels = context.getImageData(0, 0, width, height).data
  const mask = new Uint8Array(width * height)

  for (let index = 0; index < mask.length; index += 1) {
    mask[index] = pixels[index * 4 + 3] > 0 ? 1 : 0
  }

  return mask
}

function trimOutsideGuideEnvelope(
  data: Uint8ClampedArray,
  envelopeMask: Uint8Array,
) {
  for (let index = 0; index < envelopeMask.length; index += 1) {
    if (!envelopeMask[index]) {
      data[index * 4 + 3] = 0
    }
  }
}

function removeUnguidedForegroundComponents(
  data: Uint8ClampedArray,
  guideMask: Uint8Array,
  width: number,
  height: number,
) {
  const pixelCount = width * height
  const visited = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  const component = new Int32Array(pixelCount)
  const maxUnguidedComponent = Math.max(
    24,
    Math.round(pixelCount * MAX_UNGUIDED_COMPONENT_RATIO),
  )

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * 4 + 3] < COMPONENT_ALPHA_THRESHOLD) {
      continue
    }

    let head = 0
    let tail = 0
    let componentSize = 0
    let guideHits = 0

    visited[start] = 1
    queue[tail++] = start

    while (head < tail) {
      const pixelIndex = queue[head++]
      component[componentSize++] = pixelIndex
      guideHits += guideMask[pixelIndex]

      const x = pixelIndex % width
      const y = Math.floor(pixelIndex / width)

      const tryAdd = (neighbor: number) => {
        if (
          neighbor < 0 ||
          neighbor >= pixelCount ||
          visited[neighbor] ||
          data[neighbor * 4 + 3] < COMPONENT_ALPHA_THRESHOLD
        ) {
          return
        }

        visited[neighbor] = 1
        queue[tail++] = neighbor
      }

      if (x > 0) tryAdd(pixelIndex - 1)
      if (x + 1 < width) tryAdd(pixelIndex + 1)
      if (y > 0) tryAdd(pixelIndex - width)
      if (y + 1 < height) tryAdd(pixelIndex + width)
    }

    if (guideHits > 0 || componentSize > maxUnguidedComponent) {
      continue
    }

    for (let index = 0; index < componentSize; index += 1) {
      data[component[index] * 4 + 3] = 0
    }
  }
}

function cleanAlphaEdge(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const pixelCount = width * height
  const sourceAlpha = new Uint8ClampedArray(pixelCount)

  for (let pass = 0; pass < EDGE_CLEANUP_PASSES; pass += 1) {
    for (let index = 0; index < pixelCount; index += 1) {
      sourceAlpha[index] = data[index * 4 + 3]
    }

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x
        const current = sourceAlpha[pixelIndex]
        let solidNeighbors = 0

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) {
              continue
            }

            if (sourceAlpha[(y + offsetY) * width + x + offsetX] >= COMPONENT_ALPHA_THRESHOLD) {
              solidNeighbors += 1
            }
          }
        }

        if (current >= COMPONENT_ALPHA_THRESHOLD && solidNeighbors <= 2) {
          data[pixelIndex * 4 + 3] = 0
        } else if (current < 48 && solidNeighbors >= 7) {
          data[pixelIndex * 4 + 3] = 255
        }
      }
    }
  }
}

function visibleBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < VISIBLE_ALPHA_THRESHOLD) {
        continue
      }

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }

  const objectWidth = maxX - minX + 1
  const objectHeight = maxY - minY + 1
  const padding = Math.max(
    MIN_OUTPUT_PADDING,
    Math.round(Math.min(objectWidth, objectHeight) * OUTPUT_PADDING_RATIO),
  )

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    right: Math.min(width, maxX + padding + 1),
    bottom: Math.min(height, maxY + padding + 1),
  }
}

function cropToVisibleContent(
  sourceCanvas: HTMLCanvasElement,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const bounds = visibleBounds(data, width, height)
  if (!bounds) {
    return sourceCanvas
  }

  const cropWidth = Math.max(1, bounds.right - bounds.x)
  const cropHeight = Math.max(1, bounds.bottom - bounds.y)

  if (cropWidth === width && cropHeight === height) {
    return sourceCanvas
  }

  const output = document.createElement('canvas')
  output.width = cropWidth
  output.height = cropHeight

  const context = output.getContext('2d')
  if (!context) {
    return sourceCanvas
  }

  context.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  )

  return output
}

/**
 * Gemini is semantic context only. The local result remains the source of the
 * real edge; Gemini provides a generous envelope that rejects obviously
 * unrelated pixels and disconnected objects.
 */
export async function refineGeminiGuidedResult(
  localResult: Blob,
  guide: GeminiLocalGuide,
): Promise<Blob> {
  if (guide.polygon.length < 3) {
    return localResult
  }

  const image = await loadImage(localResult)
  const width = image.naturalWidth
  const height = image.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return localResult
  }

  context.drawImage(image, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const guideMask = createGuideMask(width, height, guide)
  const envelopeRadius = Math.max(
    MIN_GUIDE_ENVELOPE_RADIUS,
    Math.min(
      MAX_GUIDE_ENVELOPE_RADIUS,
      Math.round(Math.min(width, height) * GUIDE_ENVELOPE_RATIO),
    ),
  )
  const envelopeMask = createGuideMask(width, height, guide, envelopeRadius)

  trimOutsideGuideEnvelope(imageData.data, envelopeMask)
  removeUnguidedForegroundComponents(imageData.data, guideMask, width, height)
  cleanAlphaEdge(imageData.data, width, height)

  context.putImageData(imageData, 0, 0)
  const croppedCanvas = cropToVisibleContent(canvas, imageData.data, width, height)

  return canvasToPng(croppedCanvas, 'No se pudo refinar el recorte híbrido.')
}
