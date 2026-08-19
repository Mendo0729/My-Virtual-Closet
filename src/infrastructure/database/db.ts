import Dexie, { type Table } from 'dexie'
import type { Outfit, OutfitItem } from '../../features/outfits/domain/Outfit'
import type { Garment, GarmentImage } from '../../features/wardrobe/domain/Garment'

export class ClosetDatabase extends Dexie {
  garments!: Table<Garment, string>
  garmentImages!: Table<GarmentImage, string>
  outfits!: Table<Outfit, string>
  outfitItems!: Table<OutfitItem, string>

  constructor() {
    super('ClosetDB')

    this.version(1).stores({
      garments: 'id, name, category, color, createdAt',
      garmentImages: 'id, garmentId, createdAt',
    })

    this.version(2).stores({
      garments: 'id, name, category, color, createdAt',
      garmentImages: 'id, garmentId, createdAt',
      outfits: 'id, name, createdAt',
      outfitItems: 'id, outfitId, garmentId, slot, [outfitId+slot]',
    })
  }
}

export const db = new ClosetDatabase()
