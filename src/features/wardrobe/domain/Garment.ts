export type GarmentCategory = 'top' | 'bottom' | 'shoes' | 'accessory'

export interface Garment {
  id: string
  name: string
  category: GarmentCategory
  color: string
  brand?: string
  favorite?: boolean
  imageId: string
  createdAt: string
  updatedAt: string
}

export interface GarmentImage {
  id: string
  garmentId: string
  blob: Blob
  mimeType: string
  size: number
  createdAt: string
}
