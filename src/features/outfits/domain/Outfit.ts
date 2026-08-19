import type { GarmentCategory } from '../../wardrobe/domain/Garment'

export type OutfitSlot = GarmentCategory

export interface Outfit {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface OutfitItem {
  id: string
  outfitId: string
  garmentId: string
  slot: OutfitSlot
  position: number
  createdAt: string
}
