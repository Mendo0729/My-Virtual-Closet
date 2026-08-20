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
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(outfit.createdAt))

  return (
    <article className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-white shadow-[0_10px_28px_rgba(55,39,88,0.06)] dark:border-white/[0.07] dark:bg-[#0d1829] dark:shadow-none">
      <div className="grid aspect-[1.08] grid-cols-2 grid-rows-2 gap-1 bg-gradient-to-br from-violet-50 via-zinc-50 to-pink-50 p-2 dark:from-violet-500/10 dark:via-[#111c2e] dark:to-pink-500/10">
        {garments.slice(0, 4).map((garment) => (
          <GarmentImage
            key={garment.id}
            imageId={garment.imageId}
            alt={garment.name}
            className="h-full w-full rounded-xl bg-white/80 object-contain dark:bg-white/[0.03]"
          />
        ))}
        {Array.from({ length: Math.max(0, 4 - garments.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="rounded-xl bg-white/45 dark:bg-white/[0.03]" />
        ))}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-xs font-extrabold text-zinc-900 dark:text-white">{outfit.name}</h2>
            <p className="mt-1 text-[9px] text-zinc-400 dark:text-slate-500">{dateLabel}</p>
          </div>
          <span className="text-lg leading-none text-pink-500">♡</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-[10px] font-bold text-violet-600 dark:text-fuchsia-400"
        >
          {expanded ? 'Ocultar' : `${garments.length} prendas`}
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5 border-t border-zinc-100 pt-2 dark:border-white/[0.07]">
            {garments.map((garment) => (
              <div key={garment.id} className="flex items-center justify-between gap-2 text-[9px]">
                <span className="truncate font-semibold text-zinc-600 dark:text-slate-300">{garment.name}</span>
                <span className="shrink-0 text-zinc-400 dark:text-slate-500">{categoryLabels[garment.category]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
