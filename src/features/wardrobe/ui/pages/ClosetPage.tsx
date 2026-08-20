import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import ClothingIcon from '../../../../shared/components/ClothingIcon'
import UiIcon from '../../../../shared/components/UiIcon'
import GarmentCard from '../components/GarmentCard'

type ClosetFilter = 'all' | 'favorite' | 'top' | 'bottom' | 'shoes' | 'accessory'

const filters: Array<{ value: ClosetFilter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'favorite', label: 'Favoritos' },
  { value: 'top', label: 'Tops' },
  { value: 'bottom', label: 'Bottoms' },
  { value: 'shoes', label: 'Calzado' },
  { value: 'accessory', label: 'Accesorios' },
]

export default function ClosetPage() {
  const garments = useLiveQuery(
    () => db.garments.orderBy('createdAt').reverse().toArray(),
    [],
  )
  const [filter, setFilter] = useState<ClosetFilter>('all')

  const isLoading = garments === undefined
  const visibleGarments = (garments ?? []).filter((garment) => {
    if (filter === 'all') return true
    if (filter === 'favorite') return Boolean(garment.favorite)
    return garment.category === filter
  })
  const isEmpty = !isLoading && garments?.length === 0
  const isFavoriteEmpty = !isLoading && filter === 'favorite' && visibleGarments.length === 0

  return (
    <div className="px-4 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400 dark:text-slate-500">Tu colección</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Mi Closet</h1>
        </div>

        <Link
          to="/closet/new"
          className="flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 text-xs font-extrabold text-white shadow-lg shadow-pink-500/15 transition active:scale-[0.98]"
        >
          <span className="text-base leading-none" aria-hidden="true">＋</span>
          Prenda
        </Link>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => {
          const active = filter === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-bold transition',
                active
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20 dark:bg-violet-500'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-[#0d1829] dark:text-slate-400',
              ].join(' ')}
            >
              {item.value === 'favorite' && <UiIcon name="heart" className="h-3.5 w-3.5" />}
              {item.label}
            </button>
          )
        })}
      </div>

      {isLoading && (
        <div className="mt-5 rounded-[22px] bg-white px-6 py-10 text-center text-sm text-zinc-500 shadow-sm dark:bg-[#0d1829] dark:text-slate-400">
          Cargando tu closet…
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 rounded-[24px] border border-dashed border-zinc-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-[#0d1829]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <ClothingIcon kind="top" className="h-10 w-10" />
          </div>
          <h2 className="mt-4 font-extrabold text-zinc-900 dark:text-white">Tu closet está vacío</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-slate-400">Toma una foto de tu primera prenda para comenzar.</p>
          <Link
            to="/closet/new"
            className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3 text-sm font-bold text-white"
          >
            Agregar primera prenda
          </Link>
        </div>
      )}

      {garments && garments.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
              {visibleGarments.length} {visibleGarments.length === 1 ? 'prenda' : 'prendas'}
            </p>
          </div>

          {visibleGarments.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 pb-4">
              {visibleGarments.map((garment) => (
                <GarmentCard key={garment.id} garment={garment} />
              ))}
            </div>
          ) : isFavoriteEmpty ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-pink-200 bg-pink-50/60 px-5 py-9 text-center dark:border-pink-500/15 dark:bg-pink-500/[0.05]">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm dark:bg-[#0d1829]">
                <UiIcon name="heart" className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-extrabold text-zinc-800 dark:text-white">Aún no tienes favoritos</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-slate-400">Toca el corazón de una prenda para encontrarla aquí.</p>
            </div>
          ) : (
            <div className="mt-4 rounded-[22px] bg-zinc-50 px-5 py-8 text-center text-xs text-zinc-400 dark:bg-[#0d1829] dark:text-slate-500">
              No tienes prendas en esta categoría.
            </div>
          )}
        </>
      )}
    </div>
  )
}
