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
      <section className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-5 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">{label}</p>
        <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
          +
        </div>
        <p className="mt-3 text-sm font-semibold text-zinc-800">Sin prendas</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Agrega una prenda de esta categoría para usarla en tus looks.
        </p>
        <Link
          to="/closet/new"
          className="mt-4 inline-flex rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-700"
        >
          Agregar prenda
        </Link>
      </section>
    )
  }

  const arrowsDisabled = total <= 1

  return (
    <section className="rounded-[28px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">{label}</p>
        <span className="text-xs text-zinc-400">
          {currentIndex + 1} de {total}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-3">
        <button
          type="button"
          disabled={arrowsDisabled}
          onClick={onPrevious}
          className="flex h-11 items-center justify-center rounded-2xl border border-zinc-200 text-2xl text-zinc-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Prenda anterior de ${label}`}
        >
          ‹
        </button>

        <div className="min-w-0">
          <GarmentImage
            imageId={garment.imageId}
            alt={garment.name}
            className="aspect-[4/3] w-full rounded-3xl bg-[#f7f4fb] object-contain"
          />

          <div className="mt-3 text-center">
            <h2 className="truncate text-base font-semibold text-zinc-900">{garment.name}</h2>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {garment.color}
              {garment.brand ? ` · ${garment.brand}` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={arrowsDisabled}
          onClick={onNext}
          className="flex h-11 items-center justify-center rounded-2xl border border-zinc-200 text-2xl text-zinc-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Prenda siguiente de ${label}`}
        >
          ›
        </button>
      </div>
    </section>
  )
}
