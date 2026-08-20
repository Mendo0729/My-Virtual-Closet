import { db } from '../../../infrastructure/database/db'
import type { OutfitCategory, OutfitItem, OutfitSlot } from '../domain/Outfit'

export interface UpdateOutfitItemInput {
  garmentId: string
  slot: OutfitSlot
  position?: number
}

export interface UpdateOutfitInput {
  id: string
  name: string
  category: OutfitCategory
  items: UpdateOutfitItemInput[]
}

function createId(prefix: string) {
  const random =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}_${random}`
}

export async function updateOutfit(input: UpdateOutfitInput) {
  const outfit = await db.outfits.get(input.id)

  if (!outfit) {
    throw new Error('El look ya no existe.')
  }

  if (input.items.length < 2) {
    throw new Error('Un look necesita al menos dos prendas.')
  }

  const name = input.name.trim()
  if (!name) {
    throw new Error('Escribe un nombre para el look.')
  }

  const now = new Date().toISOString()
  const newItems: OutfitItem[] = input.items.map((item, index) => ({
    id: createId('outfit_item'),
    outfitId: outfit.id,
    garmentId: item.garmentId,
    slot: item.slot,
    position: item.position ?? index,
    createdAt: now,
  }))

  await db.transaction('rw', db.outfits, db.outfitItems, async () => {
    const currentItems = await db.outfitItems.where('outfitId').equals(outfit.id).toArray()

    if (currentItems.length > 0) {
      await db.outfitItems.bulkDelete(currentItems.map((item) => item.id))
    }

    await db.outfitItems.bulkAdd(newItems)
    await db.outfits.update(outfit.id, {
      name,
      category: input.category,
      updatedAt: now,
    })
  })
}
