const MAX_IMAGE_DIMENSION = 1400
const WEBP_QUALITY = 0.82
const MIN_BACKGROUND_THRESHOLD = 44
const MAX_BACKGROUND_THRESHOLD = 88
const EDGE_FEATHER_DISTANCE = 18

interface RgbColor {
  r: number
  g: number
  b: number
}

function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen seleccionada.'))
    }

    image.src = objectUrl
  })
}

function createCanvas(image: HTMLImageElement) {
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1

  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('Tu navegador no pudo preparar la imagen.')
  }

  context.drawImage(image, 0, 0, width, height)

  return { canvas, context, width, height }
}

function canvasToWebp(canvas: HTMLCanvasElement, errorMessage: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(errorMessage))
          return
        }

        resolve(blob)
      },
      'image/webp',
      WEBP_QUALITY,
    )
  })
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  values.sort((a, b) => a - b)
  const middle = Math.floor(values.length / 2)

  if (values.length % 2 === 0) {
    return (values[middle - 1] + values[middle]) / 2
  }

  return values[middle]
}

function colorDistance(r: number, g: number, b: number, background: RgbColor) {
  const red = r - background.r
  const green = g - background.g
  const blue = b - background.b

  return Math.sqrt(red * red + green * green + blue * blue)
}

function estimateBackground(data: Uint8ClampedArray, width: number, height: number) {
  const patchSize = Math.max(2, Math.min(64, Math.round(Math.min(width, height) * 0.045)))
  const reds: number[] = []
  const greens: number[] = []
  const blues: number[] = []

  const patches = [
    { startX: 0, startY: 0 },
    { startX: Math.max(0, width - patchSize), startY: 0 },
    { startX: 0, startY: Math.max(0, height - patchSize) },
    { startX: Math.max(0, width - patchSize), startY: Math.max(0, height - patchSize) },
  ]

  for (const patch of patches) {
    for (let y = patch.startY; y < Math.min(height, patch.startY + patchSize); y += 2) {
      for (let x = patch.startX; x < Math.min(width, patch.startX + patchSize); x += 2) {
        const offset = (y * width + x) * 4

        if (data[offset + 3] === 0) {
          continue
        }

        reds.push(data[offset])
        greens.push(data[offset + 1])
        blues.push(data[offset + 2])
      }
    }
  }

  const background = {
    r: median(reds),
    g: median(greens),
    b: median(blues),
  }

  const deviations: number[] = []

  for (let index = 0; index < reds.length; index += 1) {
    deviations.push(colorDistance(reds[index], greens[index], blues[index], background))
  }

  const medianDeviation = median(deviations)
  const threshold = Math.max(
    MIN_BACKGROUND_THRESHOLD,
    Math.min(MAX_BACKGROUND_THRESHOLD, MIN_BACKGROUND_THRESHOLD + medianDeviation * 2.2),
  )

  return { background, threshold }
}

function clearConnectedBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  background: RgbColor,
  threshold: number,
) {
  const pixelCount = width * height
  const visited = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let head = 0
  let tail = 0

  function enqueue(x: number, y: number) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return
    }

    const pixelIndex = y * width + x

    if (visited[pixelIndex]) {
      return
    }

    visited[pixelIndex] = 1
    const offset = pixelIndex * 4
    const distance = colorDistance(data[offset], data[offset + 1], data[offset + 2], background)

    if (distance > threshold || data[offset + 3] === 0) {
      return
    }

    queue[tail] = pixelIndex
    tail += 1
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  const featherStart = Math.max(0, threshold - EDGE_FEATHER_DISTANCE)

  while (head < tail) {
    const pixelIndex = queue[head]
    head += 1

    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const offset = pixelIndex * 4
    const distance = colorDistance(data[offset], data[offset + 1], data[offset + 2], background)

    if (distance <= featherStart) {
      data[offset + 3] = 0
    } else {
      const featherProgress = (distance - featherStart) / EDGE_FEATHER_DISTANCE
      const featherAlpha = Math.round(255 * Math.min(1, Math.max(0, featherProgress)))
      data[offset + 3] = Math.min(data[offset + 3], featherAlpha)
    }

    enqueue(x - 1, y)
    enqueue(x + 1, y)
    enqueue(x, y - 1)
    enqueue(x, y + 1)
  }
}

export async function processGarmentImage(file: File): Promise<Blob> {
  const image = await loadImage(file)
  const { canvas } = createCanvas(image)

  return canvasToWebp(canvas, 'No se pudo optimizar la imagen.')
}

export async function removeGarmentBackground(source: Blob): Promise<Blob> {
  const image = await loadImage(source)
  const { canvas, context, width, height } = createCanvas(image)
  const imageData = context.getImageData(0, 0, width, height)
  const { background, threshold } = estimateBackground(imageData.data, width, height)

  clearConnectedBackground(imageData.data, width, height, background, threshold)
  context.putImageData(imageData, 0, 0)

  return canvasToWebp(canvas, 'No se pudo quitar el fondo de la imagen.')
}
