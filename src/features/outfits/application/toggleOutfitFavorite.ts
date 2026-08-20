import { db } from '../../../infrastructure/database/db'

export async function toggleOutfitFavorite(outfitId: string) {
  return db.transaction('rw', db.outfits, async () => {
    const outfit = await db.outfits.get(outfitId)

    if (!outfit) {
      throw new Error('El look ya no existe.')
    }

    const favorite = !Boolean(outfit.favorite)

    await db.outfits.update(outfitId, {
      favorite,
      updatedAt: new Date().toISOString(),
    })

    return favorite
  })
}
