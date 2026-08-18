import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../../infrastructure/database/db'
import type { Garment } from '../../domain/Garment'

const categoryLabels: Record<Garment['category'], string> = {
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Zapatos',
  accessory: 'Accesorio',
}

interface GarmentCardProps {
  garment: Garment
}

export default function GarmentCard({ garment }: GarmentCardProps) {
  const image = useLiveQuery(() => db.garmentImages.get(garment.imageId), [garment.imageId])
  const [imageUrl, setImageUrl] = useState<string>()

  useEffect(() => {
    if (!image?.blob) {
      setImageUrl(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(image.blob)
    setImageUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
      <div className="aspect-square bg-[#f5f1fa]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={garment.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">👕</div>
        )}
      </div>

      <div className="p-3">
        <h2 className="truncate text-sm font-semibold text-zinc-900">{garment.name}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {categoryLabels[garment.category]} · {garment.color}
        </p>
        {garment.brand && (
          <p className="mt-1 truncate text-xs text-zinc-400">{garment.brand}</p>
        )}
      </div>
    </article>
  )
}
