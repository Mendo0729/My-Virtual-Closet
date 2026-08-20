import { db } from '../../../infrastructure/database/db'
import type { GarmentCategory, GarmentImage } from '../domain/Garment'

export interface UpdateGarmentInput {
  id: string
  name: string
  category: GarmentCategory
  color: string
  brand?: string
  image?: Blob
}

export async function updateGarment(input: UpdateGarmentInput) {
  const garment = await db.garments.get(input.id)

  if (!garment) {
    throw new Error('La prenda ya no existe.')
  }

  const now = new Date().toISOString()

  await db.transaction('rw', db.garments, db.garmentImages, async () => {
    if (input.image) {
      const garmentImage: GarmentImage = {
        id: garment.imageId,
        garmentId: garment.id,
        blob: input.image,
        mimeType: input.image.type || 'image/webp',
        size: input.image.size,
        createdAt: now,
      }

      await db.garmentImages.put(garmentImage)
    }

    await db.garments.put({
      ...garment,
      name: input.name.trim(),
      category: input.category,
      color: input.color.trim(),
      brand: input.brand?.trim() || undefined,
      updatedAt: now,
    })
  })
}
