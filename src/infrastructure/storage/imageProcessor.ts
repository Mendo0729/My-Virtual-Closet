const MAX_IMAGE_DIMENSION = 1400
const WEBP_QUALITY = 0.86

const CORNER_SAMPLE_RATIO = 0.07
const MIN_CORNER_SAMPLE_SIZE = 12
const MAX_CORNER_SAMPLE_SIZE = 72
const SAMPLE_STEP = 2

const SEED_BACKGROUND_DISTANCE = 14
const OUTER_BACKGROUND_DISTANCE = 22
const CENTER_BACKGROUND_DISTANCE = 10
const OUTER_NEIGHBOR_DISTANCE = 16
const CENTER_NEIGHBOR_DISTANCE = 9
const SURE_BACKGROUND_DISTANCE = 6
const EDGE_BARRIER = 28
const MAX_BACKGROUND_VARIATION_BONUS = 8
const MAX_REJECTED_ATTEMPTS = 4

const MIN_FOREGROUND_COMPONENT_PIXELS = 18
const MIN_FOREGROUND_COMPONENT_RATIO = 0.00012
const EDGE_FEATHER_PASSES = 1

interface LabColor {
  l: number
  a: number
  b: number
}

interface BackgroundModel extends LabColor {
  deviation: number
}

interface CanvasImage {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  width: number
  height: number
}

const SRGB_LINEAR = (() => {
  const table = new Float32Array(256)

  for (let value = 0; value < 256; value += 1) {
    const normalized = value / 255
    table[value] = normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }

  return table
})()

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

function createCanvas(image: HTMLImageElement): CanvasImage {
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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/webp' | 'image/png',
  errorMessage: string,
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(errorMessage))
          return
        }

        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  values.sort((left, right) => left - right)
  const middle = Math.floor(values.length / 2)

  if (values.length % 2 === 0) {
    return (values[middle - 1] + values[middle]) / 2
  }

  return values[middle]
}

function rgbToLab(r: number, g: number, b: number): LabColor {
  const red = SRGB_LINEAR[r]
  const green = SRGB_LINEAR[g]
  const blue = SRGB_LINEAR[b]

  const x = (red * 0.4124564 + green * 0.3575761 + blue * 0.1804375) / 0.95047
  const y = red * 0.2126729 + green * 0.7151522 + blue * 0.072175
  const z = (red * 0.0193339 + green * 0.119192 + blue * 0.9503041) / 1.08883

  const delta = 6 / 29
  const deltaCubed = delta * delta * delta
  const denominator = 3 * delta * delta

  const convert = (value: number) => value > deltaCubed
    ? Math.cbrt(value)
    : value / denominator + 4 / 29

  const fx = convert(x)
  const fy = convert(y)
  const fz = convert(z)

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

function createLabBuffer(data: Uint8ClampedArray) {
  const pixelCount = data.length / 4
  const lab = new Float32Array(pixelCount * 3)

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const offset = pixelIndex * 4
    const color = rgbToLab(data[offset], data[offset + 1], data[offset + 2])
    const labOffset = pixelIndex * 3
    lab[labOffset] = color.l
    lab[labOffset + 1] = color.a
    lab[labOffset + 2] = color.b
  }

  return lab
}

function labDistance(
  l: number,
  a: number,
  b: number,
  otherL: number,
  otherA: number,
  otherB: number,
) {
  const deltaL = l - otherL
  const deltaA = a - otherA
  const deltaB = b - otherB

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

function createBackgroundModels(lab: Float32Array, width: number, height: number) {
  const sampleSize = Math.max(
    MIN_CORNER_SAMPLE_SIZE,
    Math.min(MAX_CORNER_SAMPLE_SIZE, Math.round(Math.min(width, height) * CORNER_SAMPLE_RATIO)),
  )

  const corners = [
    { startX: 0, startY: 0 },
    { startX: Math.max(0, width - sampleSize), startY: 0 },
    { startX: 0, startY: Math.max(0, height - sampleSize) },
    { startX: Math.max(0, width - sampleSize), startY: Math.max(0, height - sampleSize) },
  ]

  const models: BackgroundModel[] = []

  for (const corner of corners) {
    const lightness: number[] = []
    const greenRed: number[] = []
    const blueYellow: number[] = []

    for (let y = corner.startY; y < Math.min(height, corner.startY + sampleSize); y += SAMPLE_STEP) {
      for (let x = corner.startX; x < Math.min(width, corner.startX + sampleSize); x += SAMPLE_STEP) {
        const labOffset = (y * width + x) * 3
        lightness.push(lab[labOffset])
        greenRed.push(lab[labOffset + 1])
        blueYellow.push(lab[labOffset + 2])
      }
    }

    const model: BackgroundModel = {
      l: median(lightness),
      a: median(greenRed),
      b: median(blueYellow),
      deviation: 0,
    }

    const deviations: number[] = []

    for (let index = 0; index < lightness.length; index += 1) {
      deviations.push(
        labDistance(
          lightness[index],
          greenRed[index],
          blueYellow[index],
          model.l,
          model.a,
          model.b,
        ),
      )
    }

    model.deviation = median(deviations)
    models.push(model)
  }

  return models
}

function nearestBackgroundDistance(
  lab: Float32Array,
  pixelIndex: number,
  models: BackgroundModel[],
) {
  const labOffset = pixelIndex * 3
  const l = lab[labOffset]
  const a = lab[labOffset + 1]
  const b = lab[labOffset + 2]
  let nearest = Number.POSITIVE_INFINITY

  for (const model of models) {
    const distance = labDistance(l, a, b, model.l, model.a, model.b)
    nearest = Math.min(nearest, distance)
  }

  return nearest
}

function createBackgroundDistanceMap(
  lab: Float32Array,
  pixelCount: number,
  models: BackgroundModel[],
) {
  const distances = new Float32Array(pixelCount)

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    distances[pixelIndex] = nearestBackgroundDistance(lab, pixelIndex, models)
  }

  return distances
}

function createEdgeMap(lab: Float32Array, width: number, height: number) {
  const edges = new Float32Array(width * height)

  const lightnessAt = (x: number, y: number) => lab[(y * width + x) * 3]

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const topLeft = lightnessAt(x - 1, y - 1)
      const top = lightnessAt(x, y - 1)
      const topRight = lightnessAt(x + 1, y - 1)
      const left = lightnessAt(x - 1, y)
      const right = lightnessAt(x + 1, y)
      const bottomLeft = lightnessAt(x - 1, y + 1)
      const bottom = lightnessAt(x, y + 1)
      const bottomRight = lightnessAt(x + 1, y + 1)

      const gradientX = -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight
      const gradientY = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight
      edges[y * width + x] = Math.sqrt(gradientX * gradientX + gradientY * gradientY)
    }
  }

  return edges
}

function centerStrength(x: number, y: number, width: number, height: number) {
  const normalizedX = Math.abs(x - width / 2) / Math.max(1, width / 2)
  const normalizedY = Math.abs(y - height / 2) / Math.max(1, height / 2)
  const edgeDistance = Math.max(normalizedX, normalizedY)

  return Math.max(0, Math.min(1, 1 - edgeDistance))
}

function pixelLabDistance(lab: Float32Array, leftIndex: number, rightIndex: number) {
  const leftOffset = leftIndex * 3
  const rightOffset = rightIndex * 3

  return labDistance(
    lab[leftOffset],
    lab[leftOffset + 1],
    lab[leftOffset + 2],
    lab[rightOffset],
    lab[rightOffset + 1],
    lab[rightOffset + 2],
  )
}

function connectedBackgroundMask(
  lab: Float32Array,
  backgroundDistances: Float32Array,
  edgeMap: Float32Array,
  models: BackgroundModel[],
  width: number,
  height: number,
) {
  const pixelCount = width * height
  const background = new Uint8Array(pixelCount)
  const rejectedAttempts = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let head = 0
  let tail = 0

  const backgroundVariation = Math.min(
    MAX_BACKGROUND_VARIATION_BONUS,
    median(models.map((model) => model.deviation)) * 1.5,
  )

  const seedThreshold = SEED_BACKGROUND_DISTANCE + backgroundVariation * 0.55

  function seed(pixelIndex: number) {
    if (background[pixelIndex] || backgroundDistances[pixelIndex] > seedThreshold) {
      return
    }

    background[pixelIndex] = 1
    queue[tail] = pixelIndex
    tail += 1
  }

  for (let x = 0; x < width; x += 1) {
    seed(x)
    seed((height - 1) * width + x)
  }

  for (let y = 1; y < height - 1; y += 1) {
    seed(y * width)
    seed(y * width + width - 1)
  }

  function tryEnqueue(pixelIndex: number, fromPixelIndex: number) {
    if (background[pixelIndex] || rejectedAttempts[pixelIndex] >= MAX_REJECTED_ATTEMPTS) {
      return
    }

    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const center = centerStrength(x, y, width, height)
    const backgroundThreshold =
      OUTER_BACKGROUND_DISTANCE + backgroundVariation -
      center * (OUTER_BACKGROUND_DISTANCE - CENTER_BACKGROUND_DISTANCE + backgroundVariation * 0.55)
    const neighborThreshold =
      OUTER_NEIGHBOR_DISTANCE + backgroundVariation * 0.35 -
      center * (OUTER_NEIGHBOR_DISTANCE - CENTER_NEIGHBOR_DISTANCE + backgroundVariation * 0.2)

    const backgroundDistance = backgroundDistances[pixelIndex]
    const neighborDistance = pixelLabDistance(lab, pixelIndex, fromPixelIndex)
    const crossesStrongEdge = edgeMap[pixelIndex] > EDGE_BARRIER && backgroundDistance > SURE_BACKGROUND_DISTANCE

    if (
      backgroundDistance > backgroundThreshold ||
      neighborDistance > neighborThreshold ||
      crossesStrongEdge
    ) {
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

    if (x > 0) tryEnqueue(pixelIndex - 1, pixelIndex)
    if (x + 1 < width) tryEnqueue(pixelIndex + 1, pixelIndex)
    if (y > 0) tryEnqueue(pixelIndex - width, pixelIndex)
    if (y + 1 < height) tryEnqueue(pixelIndex + width, pixelIndex)
  }

  return background
}

function removeForegroundSpecks(background: Uint8Array, width: number, height: number) {
  const pixelCount = width * height
  const visited = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  const component = new Int32Array(pixelCount)
  const minimumComponentSize = Math.max(
    MIN_FOREGROUND_COMPONENT_PIXELS,
    Math.round(pixelCount * MIN_FOREGROUND_COMPONENT_RATIO),
  )

  for (let startIndex = 0; startIndex < pixelCount; startIndex += 1) {
    if (background[startIndex] || visited[startIndex]) {
      continue
    }

    let head = 0
    let tail = 0
    let componentSize = 0

    visited[startIndex] = 1
    queue[tail] = startIndex
    tail += 1

    while (head < tail) {
      const pixelIndex = queue[head]
      head += 1
      component[componentSize] = pixelIndex
      componentSize += 1

      const x = pixelIndex % width
      const y = Math.floor(pixelIndex / width)
      const neighbors = [
        x > 0 ? pixelIndex - 1 : -1,
        x + 1 < width ? pixelIndex + 1 : -1,
        y > 0 ? pixelIndex - width : -1,
        y + 1 < height ? pixelIndex + width : -1,
      ]

      for (const neighbor of neighbors) {
        if (neighbor < 0 || background[neighbor] || visited[neighbor]) {
          continue
        }

        visited[neighbor] = 1
        queue[tail] = neighbor
        tail += 1
      }
    }

    if (componentSize >= minimumComponentSize) {
      continue
    }

    for (let index = 0; index < componentSize; index += 1) {
      background[component[index]] = 1
    }
  }

  return background
}

function closeTinyMaskGaps(background: Uint8Array, width: number, height: number) {
  const cleaned = background.slice()

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixelIndex = y * width + x
      let foregroundNeighbors = 0

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (!background[(y + offsetY) * width + x + offsetX]) {
            foregroundNeighbors += 1
          }
        }
      }

      if (background[pixelIndex] && foregroundNeighbors >= 7) {
        cleaned[pixelIndex] = 0
      } else if (!background[pixelIndex] && foregroundNeighbors <= 2) {
        cleaned[pixelIndex] = 1
      }
    }
  }

  return cleaned
}

function createAlphaMask(background: Uint8Array, width: number, height: number) {
  let alpha = new Uint8ClampedArray(background.length)

  for (let index = 0; index < background.length; index += 1) {
    alpha[index] = background[index] ? 0 : 255
  }

  for (let pass = 0; pass < EDGE_FEATHER_PASSES; pass += 1) {
    const feathered = alpha.slice()

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x
        let minimum = 255
        let maximum = 0
        let sum = 0

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const value = alpha[(y + offsetY) * width + x + offsetX]
            minimum = Math.min(minimum, value)
            maximum = Math.max(maximum, value)
            sum += value
          }
        }

        if (minimum !== maximum) {
          feathered[pixelIndex] = Math.round(sum / 9)
        }
      }
    }

    alpha = feathered
  }

  return alpha
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

  return canvasToBlob(canvas, 'image/webp', 'No se pudo optimizar la imagen.', WEBP_QUALITY)
}

export async function removeGarmentBackground(source: Blob): Promise<Blob> {
  const image = await loadImage(source)
  const { canvas, context, width, height } = createCanvas(image)
  const imageData = context.getImageData(0, 0, width, height)
  const pixelCount = width * height

  const lab = createLabBuffer(imageData.data)
  const backgroundModels = createBackgroundModels(lab, width, height)
  const backgroundDistances = createBackgroundDistanceMap(lab, pixelCount, backgroundModels)
  const edgeMap = createEdgeMap(lab, width, height)
  const connectedBackground = connectedBackgroundMask(
    lab,
    backgroundDistances,
    edgeMap,
    backgroundModels,
    width,
    height,
  )
  const cleanedBackground = closeTinyMaskGaps(
    removeForegroundSpecks(connectedBackground, width, height),
    width,
    height,
  )
  const alpha = createAlphaMask(cleanedBackground, width, height)

  decontaminateEdgeColors(imageData.data, alpha, width, height)
  applyAlpha(imageData.data, alpha)
  context.putImageData(imageData, 0, 0)

  return canvasToBlob(canvas, 'image/png', 'No se pudo quitar el fondo de la imagen.')
}
