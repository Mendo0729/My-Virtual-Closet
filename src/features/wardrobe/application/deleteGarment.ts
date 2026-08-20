import { db } from '../../../infrastructure/database/db'

export async function deleteGarment(garmentId: string) {
  const garment = await db.garments.get(garmentId)

  if (!garment) {
    throw new Error('La prenda ya no existe.')
  }

  const relatedItems = await db.outfitItems.where('garmentId').equals(garmentId).toArray()
  const affectedOutfitIds = [...new Set(relatedItems.map((item) => item.outfitId))]

  await db.transaction(
    'rw',
    db.garments,
    db.garmentImages,
    db.outfits,
    db.outfitItems,
    async () => {
      if (relatedItems.length > 0) {
        await db.outfitItems.bulkDelete(relatedItems.map((item) => item.id))
      }

      for (const outfitId of affectedOutfitIds) {
        const remainingItems = await db.outfitItems.where('outfitId').equals(outfitId).count()
        if (remainingItems === 0) {
          await db.outfits.delete(outfitId)
        } else {
          await db.outfits.update(outfitId, { updatedAt: new Date().toISOString() })
        }
      }

      await db.garmentImages.delete(garment.imageId)
      await db.garments.delete(garment.id)
    },
  )

  return { affectedLookCount: affectedOutfitIds.length }
}
