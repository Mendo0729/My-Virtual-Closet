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

      return {
        outfit,
        garments: outfitGarments,
      }
    })
  }, [])

  return (
    <div className="px-4 pt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Combinaciones guardadas</p>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Looks</h1>
        </div>

        <Link
          to="/outfit"
          className="shrink-0 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          + Look
        </Link>
      </div>

      {savedOutfits === undefined && (
        <div className="mt-7 rounded-3xl bg-white px-6 py-10 text-center text-sm text-zinc-500 shadow-sm">
          Cargando tus looks…
        </div>
      )}

      {savedOutfits?.length === 0 && (
        <div className="mt-7 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <div className="text-4xl">♡</div>

          <h2 className="mt-4 font-semibold">No tienes looks guardados</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Combina al menos dos prendas y guarda tu primer look.
          </p>

          <Link
            to="/outfit"
            className="mt-5 inline-flex rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Crear mi primer look
          </Link>
        </div>
      )}

      {savedOutfits && savedOutfits.length > 0 && (
        <div className="mt-6 space-y-4">
          {savedOutfits.map(({ outfit, garments }) => (
            <SavedOutfitCard key={outfit.id} outfit={outfit} garments={garments} />
          ))}
        </div>
      )}
    </div>
  )
}
