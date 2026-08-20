import { db } from '../../../infrastructure/database/db'

export async function deleteOutfit(outfitId: string) {
  const outfit = await db.outfits.get(outfitId)

  if (!outfit) {
    throw new Error('El look ya no existe.')
  }

  await db.transaction('rw', db.outfits, db.outfitItems, async () => {
    await db.outfitItems.where('outfitId').equals(outfitId).delete()
    await db.outfits.delete(outfitId)
  })
}
