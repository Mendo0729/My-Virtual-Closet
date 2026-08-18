import Dexie, { type Table } from 'dexie'
import type { Garment, GarmentImage } from '../../features/wardrobe/domain/Garment'

export class ClosetDatabase extends Dexie {
  garments!: Table<Garment, string>
  garmentImages!: Table<GarmentImage, string>

  constructor() {
    super('ClosetDB')

    this.version(1).stores({
      garments: 'id, name, category, color, createdAt',
      garmentImages: 'id, garmentId, createdAt',
    })
  }
}

export const db = new ClosetDatabase()
