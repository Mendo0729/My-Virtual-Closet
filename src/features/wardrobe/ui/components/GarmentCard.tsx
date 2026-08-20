import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import ClothingIcon from '../../../../shared/components/ClothingIcon'
import UiIcon from '../../../../shared/components/UiIcon'
import type { Garment } from '../../domain/Garment'

const categoryLabels: Record<Garment['category'], string> = {
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Zapatos',
  accessory: 'Accesorio',
}

const categoryTone: Record<Garment['category'], string> = {
  top: 'text-violet-500 dark:text-violet-300',
  bottom: 'text-indigo-500 dark:text-indigo-300',
  shoes: 'text-pink-500 dark:text-pink-300',
  accessory: 'text-amber-500 dark:text-amber-300',
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
    <Link
      to={`/closet/${garment.id}/edit`}
      className="block transition active:scale-[0.985]"
      aria-label={`Editar ${garment.name}`}
    >
      <article className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_8px_24px_rgba(52,36,86,0.06)] transition-colors dark:border-white/[0.07] dark:bg-[#0d1829] dark:shadow-none">
        <div className="relative aspect-square bg-gradient-to-br from-violet-50 to-zinc-50 dark:from-violet-500/10 dark:to-[#111c2e]">
          {imageUrl ? (
            <img src={imageUrl} alt={garment.name} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full items-center justify-center ${categoryTone[garment.category]}`}>
              <ClothingIcon kind={garment.category} className="h-16 w-16 opacity-80" />
            </div>
          )}

          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-zinc-700 shadow-sm backdrop-blur dark:bg-[#0d1829]/90 dark:text-slate-200">
            <UiIcon name="pencil" className="h-4 w-4" />
          </span>
        </div>

        <div className="p-3">
          <h2 className="truncate text-sm font-extrabold text-zinc-900 dark:text-white">{garment.name}</h2>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-slate-400">
            {categoryLabels[garment.category]} · {garment.color}
          </p>
          {garment.brand && <p className="mt-1 truncate text-[10px] text-zinc-400 dark:text-slate-500">{garment.brand}</p>}
        </div>
      </article>
    </Link>
  )
}
