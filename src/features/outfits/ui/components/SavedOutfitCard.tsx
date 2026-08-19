import { useState } from 'react'
import type { Outfit } from '../../domain/Outfit'
import type { Garment } from '../../../wardrobe/domain/Garment'
import GarmentImage from './GarmentImage'

interface SavedOutfitCardProps {
  outfit: Outfit
  garments: Garment[]
}

const categoryLabels: Record<Garment['category'], string> = {
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Zapatos',
  accessory: 'Accesorio',
}

export default function SavedOutfitCard({ outfit, garments }: SavedOutfitCardProps) {
  const [expanded, setExpanded] = useState(false)
  const dateLabel = new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(outfit.createdAt))

  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-zinc-900">{outfit.name}</h2>
            <p className="mt-1 text-xs text-zinc-400">{dateLabel}</p>
          </div>

          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
            {garments.length} prendas
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {garments.slice(0, 4).map((garment) => (
            <GarmentImage
              key={garment.id}
              imageId={garment.imageId}
              alt={garment.name}
              className="aspect-square w-full rounded-2xl bg-[#f7f4fb] object-contain"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 w-full rounded-2xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700"
        >
          {expanded ? 'Ocultar prendas' : 'Ver prendas'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-3">
          <div className="space-y-2">
            {garments.map((garment) => (
              <div key={garment.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-zinc-700">{garment.name}</span>
                <span className="text-zinc-400">{categoryLabels[garment.category]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
