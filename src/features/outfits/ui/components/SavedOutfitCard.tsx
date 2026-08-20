import { useState } from 'react'
import { Link } from 'react-router'
import UiIcon from '../../../../shared/components/UiIcon'
import { toggleOutfitFavorite } from '../../application/toggleOutfitFavorite'
import type { Outfit, OutfitCategory } from '../../domain/Outfit'
import type { Garment } from '../../../wardrobe/domain/Garment'
import GarmentImage from './GarmentImage'

interface SavedOutfitCardProps {
  outfit: Outfit
  garments: Garment[]
}

const garmentCategoryLabels: Record<Garment['category'], string> = {
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Zapatos',
  accessory: 'Accesorio',
}

const outfitCategoryLabels: Record<OutfitCategory, string> = {
  casual: 'Casual',
  trabajo: 'Trabajo',
  noche: 'Noche',
  deporte: 'Deporte',
}

const outfitCategoryTone: Record<OutfitCategory, string> = {
  casual: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  trabajo: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  noche: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  deporte: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
}

export default function SavedOutfitCard({ outfit, garments }: SavedOutfitCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false)
  const dateLabel = new Intl.DateTimeFormat('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(outfit.createdAt))

  const category = outfit.category ?? 'casual'
  const isFavorite = Boolean(outfit.favorite)

  async function handleFavorite() {
    if (isFavoriteSaving) return

    setIsFavoriteSaving(true)
    try {
      await toggleOutfitFavorite(outfit.id)
    } finally {
      setIsFavoriteSaving(false)
    }
  }

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-black/[0.05] bg-white shadow-[0_10px_28px_rgba(55,39,88,0.06)] dark:border-white/[0.07] dark:bg-[#0d1829] dark:shadow-none">
      <div className="relative grid aspect-[1.08] grid-cols-2 grid-rows-2 gap-1 bg-gradient-to-br from-violet-50 via-zinc-50 to-pink-50 p-2 dark:from-violet-500/10 dark:via-[#111c2e] dark:to-pink-500/10">
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

        <Link
          to={`/outfits/${outfit.id}/edit`}
          aria-label={`Editar ${outfit.name}`}
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition active:scale-90 dark:bg-[#0d1829]/90 dark:text-slate-200"
        >
          <UiIcon name="pencil" className="h-4 w-4" />
        </Link>

        <button
          type="button"
          disabled={isFavoriteSaving}
          onClick={handleFavorite}
          aria-label={isFavorite ? `Quitar ${outfit.name} de favoritos` : `Agregar ${outfit.name} a favoritos`}
          aria-pressed={isFavorite}
          className={[
            'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 shadow-sm backdrop-blur transition active:scale-90 disabled:opacity-60 dark:bg-[#0d1829]/90',
            isFavorite ? 'text-pink-500' : 'text-zinc-500 dark:text-slate-300',
          ].join(' ')}
        >
          <UiIcon name="heart" className={isFavorite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
        </button>
      </div>

      <div className="p-3">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-extrabold text-zinc-900 dark:text-white">{outfit.name}</h2>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold ${outfitCategoryTone[category]}`}>
              {outfitCategoryLabels[category]}
            </span>
            <span className="text-[9px] text-zinc-400 dark:text-slate-500">{dateLabel}</span>
          </div>
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
                <span className="shrink-0 text-zinc-400 dark:text-slate-500">{garmentCategoryLabels[garment.category]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
