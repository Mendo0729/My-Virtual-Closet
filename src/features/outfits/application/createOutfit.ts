import { db } from '../../../infrastructure/database/db'
import type { Outfit, OutfitCategory, OutfitItem, OutfitSlot } from '../domain/Outfit'

export interface CreateOutfitItemInput {
  garmentId: string
  slot: OutfitSlot
  position?: number
}

export interface CreateOutfitInput {
  name?: string
  category?: OutfitCategory
  items: CreateOutfitItemInput[]
}

function createId(prefix: string) {
  const random =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}_${random}`
}

export async function createOutfit(input: CreateOutfitInput) {
  if (input.items.length < 2) {
    throw new Error('Un look necesita al menos dos prendas.')
  }

  const now = new Date().toISOString()
  const outfitId = createId('outfit')
  const requestedName = input.name?.trim()
  const defaultName = `Look #${(await db.outfits.count()) + 1}`

  const outfit: Outfit = {
    id: outfitId,
    name: requestedName || defaultName,
    category: input.category ?? 'casual',
    favorite: false,
    createdAt: now,
    updatedAt: now,
  }

  const items: OutfitItem[] = input.items.map((item, index) => ({
    id: createId('outfit_item'),
    outfitId,
    garmentId: item.garmentId,
    slot: item.slot,
    position: item.position ?? index,
    createdAt: now,
  }))

  await db.transaction('rw', db.outfits, db.outfitItems, async () => {
    await db.outfits.add(outfit)
    await db.outfitItems.bulkAdd(items)
  })

  return outfit
}
