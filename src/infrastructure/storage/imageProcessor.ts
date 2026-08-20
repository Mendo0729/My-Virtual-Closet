const MAX_IMAGE_DIMENSION = 1400
const WEBP_QUALITY = 0.86
const BORDER_SAMPLE_RATIO = 0.045
const MIN_BORDER_SAMPLE_SIZE = 8
const MAX_BORDER_SAMPLE_SIZE = 48
const MAX_BACKGROUND_COLORS = 24
const COLOR_BIN_SIZE = 32
const OUTER_BACKGROUND_THRESHOLD = 54
const CENTER_BACKGROUND_THRESHOLD = 36
const OUTER_NEIGHBOR_THRESHOLD = 40
const CENTER_NEIGHBOR_THRESHOLD = 28
const STRICT_BACKGROUND_THRESHOLD = 24
const MAX_REJECTED_ATTEMPTS = 4
const EDGE_BLUR_PASSES = 2

interface RgbColor {
  r: number
  g: number
  b: number
}

interface ColorBucket extends RgbColor {
  count: number
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

function colorDistance(r: number, g: number, b: number, color: RgbColor) {
  const red = r - color.r
  const green = g - color.g
  const blue = b - color.b

  return Math.sqrt(red * red + green * green + blue * blue)
}

function collectBackgroundPalette(data: Uint8ClampedArray, width: number, height: number) {
  const borderSize = Math.max(
    MIN_BORDER_SAMPLE_SIZE,
    Math.min(MAX_BORDER_SAMPLE_SIZE, Math.round(Math.min(width, height) * BORDER_SAMPLE_RATIO)),
  )
  const buckets = new Map<number, ColorBucket>()

  function addPixel(x: number, y: number) {
    const offset = (y * width + x) * 4

    if (data[offset + 3] === 0) {
      return
    }

    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]
    const rBin = Math.floor(r / COLOR_BIN_SIZE)
    const gBin = Math.floor(g / COLOR_BIN_SIZE)
    const bBin = Math.floor(b / COLOR_BIN_SIZE)
    const key = (rBin << 6) | (gBin << 3) | bBin
    const bucket = buckets.get(key)

    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.count += 1
      return
    }

    buckets.set(key, { r, g, b, count: 1 })
  }

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (x < borderSize || x >= width - borderSize || y < borderSize || y >= height - borderSize) {
        addPixel(x, y)
      }
    }
  }

  const palette = Array.from(buckets.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, MAX_BACKGROUND_COLORS)
    .map((bucket) => ({
      r: bucket.r / bucket.count,
      g: bucket.g / bucket.count,
      b: bucket.b / bucket.count,
    }))

  if (palette.length > 0) {
    return palette
  }

  return [{ r: 255, g: 255, b: 255 }]
}

function nearestPaletteDistance(r: number, g: number, b: number, palette: RgbColor[]) {
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const color of palette) {
    const distance = colorDistance(r, g, b, color)

    if (distance < nearestDistance) {
      nearestDistance = distance
    }
  }

  return nearestDistance
}

function centerStrength(x: number, y: number, width: number, height: number) {
  const normalizedX = Math.abs(x - width / 2) / Math.max(1, width / 2)
  const normalizedY = Math.abs(y - height / 2) / Math.max(1, height / 2)
  const edgeDistance = Math.max(normalizedX, normalizedY)

  return Math.max(0, Math.min(1, 1 - edgeDistance))
}

function connectedBackgroundMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RgbColor[],
) {
  const pixelCount = width * height
  const background = new Uint8Array(pixelCount)
  const rejectedAttempts = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let head = 0
  let tail = 0

  function seed(x: number, y: number) {
    const pixelIndex = y * width + x

    if (background[pixelIndex]) {
      return
    }

    background[pixelIndex] = 1
    queue[tail] = pixelIndex
    tail += 1
  }

  for (let x = 0; x < width; x += 1) {
    seed(x, 0)
    seed(x, height - 1)
  }

  for (let y = 1; y < height - 1; y += 1) {
    seed(0, y)
    seed(width - 1, y)
  }

  function tryEnqueue(pixelIndex: number, fromPixelIndex: number) {
    if (pixelIndex < 0 || pixelIndex >= pixelCount || background[pixelIndex]) {
      return
    }

    if (rejectedAttempts[pixelIndex] >= MAX_REJECTED_ATTEMPTS) {
      return
    }

    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const offset = pixelIndex * 4
    const fromOffset = fromPixelIndex * 4

    if (data[offset + 3] === 0) {
      background[pixelIndex] = 1
      queue[tail] = pixelIndex
      tail += 1
      return
    }

    const paletteDistance = nearestPaletteDistance(data[offset], data[offset + 1], data[offset + 2], palette)
    const neighborDistance = colorDistance(
      data[offset],
      data[offset + 1],
      data[offset + 2],
      {
        r: data[fromOffset],
        g: data[fromOffset + 1],
        b: data[fromOffset + 2],
      },
    )
    const center = centerStrength(x, y, width, height)
    const paletteThreshold = OUTER_BACKGROUND_THRESHOLD - center * (OUTER_BACKGROUND_THRESHOLD - CENTER_BACKGROUND_THRESHOLD)
    const neighborThreshold = OUTER_NEIGHBOR_THRESHOLD - center * (OUTER_NEIGHBOR_THRESHOLD - CENTER_NEIGHBOR_THRESHOLD)
    const isStrictBackground = paletteDistance <= STRICT_BACKGROUND_THRESHOLD
    const followsBackground = paletteDistance <= paletteThreshold && neighborDistance <= neighborThreshold

    if (!isStrictBackground && !followsBackground) {
      rejectedAttempts[pixelIndex] += 1
      return
    }

    background[pixelIndex] = 1
    queue[tail] = pixelIndex
    tail += 1
  }

  while (head < tail) {
    const pixelIndex = queue[head]
    head += 1

    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    if (x > 0) {
      tryEnqueue(pixelIndex - 1, pixelIndex)
    }
    if (x + 1 < width) {
      tryEnqueue(pixelIndex + 1, pixelIndex)
    }
    if (y > 0) {
      tryEnqueue(pixelIndex - width, pixelIndex)
    }
    if (y + 1 < height) {
      tryEnqueue(pixelIndex + width, pixelIndex)
    }
  }

  return background
}

function expandBackgroundMask(
  background: Uint8Array,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RgbColor[],
) {
  const expanded = background.slice()

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixelIndex = y * width + x

      if (background[pixelIndex]) {
        continue
      }

      let backgroundNeighbors = 0

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) {
            continue
          }

          if (background[(y + offsetY) * width + x + offsetX]) {
            backgroundNeighbors += 1
          }
        }
      }

      if (backgroundNeighbors < 6) {
        continue
      }

      const offset = pixelIndex * 4
      const paletteDistance = nearestPaletteDistance(data[offset], data[offset + 1], data[offset + 2], palette)
      const center = centerStrength(x, y, width, height)
      const threshold = OUTER_BACKGROUND_THRESHOLD + 8 - center * 12

      if (paletteDistance <= threshold) {
        expanded[pixelIndex] = 1
      }
    }
  }

  return expanded
}

function createAlphaMask(background: Uint8Array) {
  const alpha = new Uint8ClampedArray(background.length)

  for (let index = 0; index < background.length; index += 1) {
    alpha[index] = background[index] ? 0 : 255
  }

  return alpha
}

function despeckleAlpha(alpha: Uint8ClampedArray, width: number, height: number) {
  const cleaned = alpha.slice()

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let foregroundNeighbors = 0

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (alpha[(y + offsetY) * width + x + offsetX] >= 128) {
            foregroundNeighbors += 1
          }
        }
      }

      const pixelIndex = y * width + x

      if (foregroundNeighbors <= 2) {
        cleaned[pixelIndex] = 0
      } else if (foregroundNeighbors >= 7) {
        cleaned[pixelIndex] = 255
      }
    }
  }

  return cleaned
}

function blurAlpha(alpha: Uint8ClampedArray, width: number, height: number) {
  let current = alpha

  for (let pass = 0; pass < EDGE_BLUR_PASSES; pass += 1) {
    const blurred = current.slice()

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x
        let minimum = 255
        let maximum = 0
        let sum = 0

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const value = current[(y + offsetY) * width + x + offsetX]
            minimum = Math.min(minimum, value)
            maximum = Math.max(maximum, value)
            sum += value
          }
        }

        if (minimum === maximum) {
          continue
        }

        blurred[pixelIndex] = Math.round(sum / 9)
      }
    }

    current = blurred
  }

  return current
}

function decontaminateEdgeColors(
  data: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const source = data.slice()

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixelIndex = y * width + x
      const currentAlpha = alpha[pixelIndex]

      if (currentAlpha === 0 || currentAlpha === 255) {
        continue
      }

      let red = 0
      let green = 0
      let blue = 0
      let weight = 0

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const neighborIndex = (y + offsetY) * width + x + offsetX
          const neighborAlpha = alpha[neighborIndex]

          if (neighborAlpha < 192) {
            continue
          }

          const neighborOffset = neighborIndex * 4
          red += source[neighborOffset] * neighborAlpha
          green += source[neighborOffset + 1] * neighborAlpha
          blue += source[neighborOffset + 2] * neighborAlpha
          weight += neighborAlpha
        }
      }

      if (weight === 0) {
        continue
      }

      const offset = pixelIndex * 4
      data[offset] = Math.round(red / weight)
      data[offset + 1] = Math.round(green / weight)
      data[offset + 2] = Math.round(blue / weight)
    }
  }
}

function applyAlpha(data: Uint8ClampedArray, alpha: Uint8ClampedArray) {
  for (let index = 0; index < alpha.length; index += 1) {
    data[index * 4 + 3] = alpha[index]
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
  const palette = collectBackgroundPalette(imageData.data, width, height)
  const connectedBackground = connectedBackgroundMask(imageData.data, width, height, palette)
  const expandedBackground = expandBackgroundMask(connectedBackground, imageData.data, width, height, palette)
  const alpha = blurAlpha(despeckleAlpha(createAlphaMask(expandedBackground), width, height), width, height)

  decontaminateEdgeColors(imageData.data, alpha, width, height)
  applyAlpha(imageData.data, alpha)
  context.putImageData(imageData, 0, 0)

  return canvasToWebp(canvas, 'No se pudo quitar el fondo de la imagen.')
}
