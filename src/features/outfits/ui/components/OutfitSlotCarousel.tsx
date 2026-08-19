import { Link } from 'react-router'
import type { Garment } from '../../../wardrobe/domain/Garment'
import GarmentImage from './GarmentImage'

interface OutfitSlotCarouselProps {
  label: string
  garment?: Garment
  currentIndex: number
  total: number
  onPrevious: () => void
  onNext: () => void
}

export default function OutfitSlotCarousel({
  label,
  garment,
  currentIndex,
  total,
  onPrevious,
  onNext,
}: OutfitSlotCarouselProps) {
  if (!garment) {
    return (
      <section className="flex min-h-[82px] items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-3 py-2.5 shadow-sm">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">{label}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-800">Sin prendas</p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">Agrega una para completar el look.</p>
        </div>

        <Link
          to="/closet/new"
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 px-3 text-xs font-semibold text-violet-700"
        >
          + Agregar
        </Link>
      </section>
    )
  }

  const arrowsDisabled = total <= 1

  return (
    <section className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">{label}</p>
        <span className="text-[11px] tabular-nums text-zinc-400">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <div className="grid grid-cols-[34px_76px_1fr_34px] items-center gap-2.5">
        <button
          type="button"
          disabled={arrowsDisabled}
          onClick={onPrevious}
          className="flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-xl text-zinc-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Prenda anterior de ${label}`}
        >
          ‹
        </button>

        <GarmentImage
          imageId={garment.imageId}
          alt={garment.name}
          className="h-[76px] w-[76px] rounded-xl bg-[#f7f4fb] object-contain"
        />

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900">{garment.name}</h2>
          <p className="mt-1 truncate text-xs text-zinc-500">{garment.color}</p>
          {garment.brand && <p className="mt-0.5 truncate text-[11px] text-zinc-400">{garment.brand}</p>}
        </div>

        <button
          type="button"
          disabled={arrowsDisabled}
          onClick={onNext}
          className="flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-xl text-zinc-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Prenda siguiente de ${label}`}
        >
          ›
        </button>
      </div>
    </section>
  )
}
