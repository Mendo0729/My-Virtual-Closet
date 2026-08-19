import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import type { Garment } from '../../../wardrobe/domain/Garment'
import SavedOutfitCard from '../components/SavedOutfitCard'

export default function SavedOutfitsPage() {
  const savedOutfits = useLiveQuery(async () => {
    const [outfits, items, garments] = await Promise.all([
      db.outfits.orderBy('createdAt').reverse().toArray(),
      db.outfitItems.toArray(),
      db.garments.toArray(),
    ])

    const garmentById = new Map(garments.map((garment) => [garment.id, garment]))

    return outfits.map((outfit) => {
      const outfitGarments = items
        .filter((item) => item.outfitId === outfit.id)
        .sort((left, right) => left.position - right.position)
        .map((item) => garmentById.get(item.garmentId))
        .filter((garment): garment is Garment => garment !== undefined)

      return { outfit, garments: outfitGarments }
    })
  }, [])

  return (
    <div className="px-4 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400 dark:text-slate-500">Tus combinaciones</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Looks Guardados</h1>
        </div>

        <Link
          to="/outfit"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/[0.05] bg-white text-xl text-zinc-700 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829] dark:text-white"
          aria-label="Crear look"
        >
          ＋
        </Link>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {['Todos', 'Casual', 'Trabajo', 'Noche', 'Deporte'].map((label, index) => (
          <span
            key={label}
            className={[
              'shrink-0 rounded-xl px-3.5 py-2 text-[10px] font-bold',
              index === 0
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20 dark:bg-violet-500'
                : 'bg-zinc-100 text-zinc-500 dark:bg-[#0d1829] dark:text-slate-500',
            ].join(' ')}
          >
            {label}
          </span>
        ))}
      </div>

      {savedOutfits === undefined && (
        <div className="mt-6 rounded-[22px] bg-white px-6 py-10 text-center text-sm text-zinc-500 shadow-sm dark:bg-[#0d1829] dark:text-slate-400">
          Cargando tus looks…
        </div>
      )}

      {savedOutfits?.length === 0 && (
        <div className="mt-6 rounded-[24px] border border-dashed border-zinc-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-[#0d1829]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-pink-50 text-2xl text-pink-500 dark:bg-pink-500/10">♡</div>
          <h2 className="mt-4 font-extrabold text-zinc-900 dark:text-white">No tienes looks guardados</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-slate-400">Combina al menos dos prendas y guarda tu primer look.</p>
          <Link
            to="/outfit"
            className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3 text-sm font-extrabold text-white"
          >
            Crear mi primer look
          </Link>
        </div>
      )}

      {savedOutfits && savedOutfits.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 pb-4">
          {savedOutfits.map(({ outfit, garments }) => (
            <SavedOutfitCard key={outfit.id} outfit={outfit} garments={garments} />
          ))}
        </div>
      )}
    </div>
  )
}
