import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import GarmentCard from '../components/GarmentCard'

export default function ClosetPage() {
  const garments = useLiveQuery(
    () => db.garments.orderBy('createdAt').reverse().toArray(),
    [],
  )

  const isLoading = garments === undefined
  const isEmpty = garments?.length === 0

  return (
    <div className="px-4 pt-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Colección</p>
          <h1 className="text-2xl font-semibold tracking-tight">Mi Closet</h1>
        </div>

        <Link
          to="/closet/new"
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Prenda
        </Link>
      </div>

      {isLoading && (
        <div className="mt-6 rounded-3xl bg-white px-6 py-10 text-center text-sm text-zinc-500 shadow-sm">
          Cargando tu closet…
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-3xl">
            👕
          </div>

          <h2 className="mt-4 font-semibold">Tu closet está vacío</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Toma una foto de tu primera prenda para comenzar.
          </p>

          <Link
            to="/closet/new"
            className="mt-5 inline-flex rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Agregar primera prenda
          </Link>
        </div>
      )}

      {garments && garments.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {garments.length} {garments.length === 1 ? 'prenda' : 'prendas'}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 pb-4">
            {garments.map((garment) => (
              <GarmentCard key={garment.id} garment={garment} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
