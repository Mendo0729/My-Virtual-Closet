import { db } from '../../../infrastructure/database/db'
import type { Garment, GarmentCategory, GarmentImage } from '../domain/Garment'

export interface CreateGarmentInput {
  name: string
  category: GarmentCategory
  color: string
  brand?: string
  image: Blob
}

function createId(prefix: string) {
  const random =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}_${random}`
}

export async function createGarment(input: CreateGarmentInput) {
  const now = new Date().toISOString()
  const garmentId = createId('garment')
  const imageId = createId('image')

  const garment: Garment = {
    id: garmentId,
    name: input.name.trim(),
    category: input.category,
    color: input.color.trim(),
    brand: input.brand?.trim() || undefined,
    favorite: false,
    imageId,
    createdAt: now,
    updatedAt: now,
  }

  const garmentImage: GarmentImage = {
    id: imageId,
    garmentId,
    blob: input.image,
    mimeType: input.image.type || 'image/webp',
    size: input.image.size,
    createdAt: now,
  }

  await db.transaction('rw', db.garments, db.garmentImages, async () => {
    await db.garments.add(garment)
    await db.garmentImages.add(garmentImage)
  })

  return garment
}
