import { db } from '../../../infrastructure/database/db'

export async function toggleGarmentFavorite(garmentId: string) {
  return db.transaction('rw', db.garments, async () => {
    const garment = await db.garments.get(garmentId)

    if (!garment) {
      throw new Error('La prenda ya no existe.')
    }

    const favorite = !Boolean(garment.favorite)

    await db.garments.update(garmentId, {
      favorite,
      updatedAt: new Date().toISOString(),
    })

    return favorite
  })
}
