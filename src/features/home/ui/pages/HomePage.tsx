import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import type { GarmentCategory } from '../../../wardrobe/domain/Garment'

const categories: Array<{
  name: string
  category: GarmentCategory
  icon: string
}> = [
  {
    name: 'Tops',
    category: 'top',
    icon: '👚',
  },
  {
    name: 'Bottoms',
    category: 'bottom',
    icon: '👖',
  },
  {
    name: 'Zapatos',
    category: 'shoes',
    icon: '👟',
  },
]

export default function HomePage() {
  const garments = useLiveQuery(() => db.garments.toArray(), [], [])
  const latestOutfits = useLiveQuery(
    () => db.outfits.orderBy('createdAt').reverse().limit(2).toArray(),
    [],
    [],
  )

  return (
    <div>
      <header className="flex items-center justify-between px-5 pb-4 pt-7">
        <div>
          <p className="text-sm text-zinc-500">Mi armario digital</p>

          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900">
            My Virtual Closet
          </h1>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
          MVC
        </div>
      </header>

      <section className="px-4">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-100 via-purple-50 to-pink-50 p-5">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            <span className="text-2xl">✨</span>
          </div>

          <p className="text-sm font-medium text-violet-700">Tu estilo, tus prendas</p>

          <h2 className="mt-1 max-w-[280px] text-2xl font-semibold leading-tight tracking-tight text-zinc-900">
            ¿Qué te vas a poner hoy?
          </h2>

          <p className="mt-2 max-w-[300px] text-sm leading-6 text-zinc-600">
            Explora tu closet y crea una combinación con las prendas que ya tienes.
          </p>

          <Link
            to="/outfit"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
          >
            Crear un outfit
          </Link>
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between px-5">
          <h2 className="text-lg font-semibold text-zinc-900">Tu closet</h2>

          <Link to="/closet" className="text-sm font-medium text-violet-600">
            Ver todo
          </Link>
        </div>

        <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
          {categories.map((category) => {
            const count = garments.filter((garment) => garment.category === category.category).length

            return (
              <Link
                key={category.name}
                to="/closet"
                className="min-w-[120px] flex-1 rounded-3xl border border-zinc-100 bg-white p-3 shadow-sm"
              >
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#f5f1fa] text-5xl">
                  {category.icon}
                </div>

                <h3 className="mt-3 text-sm font-semibold text-zinc-900">{category.name}</h3>

                <p className="mt-0.5 text-xs text-zinc-500">
                  {count} {count === 1 ? 'prenda' : 'prendas'}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mt-7 px-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-zinc-900">Últimos looks</h2>

          <Link to="/outfits" className="text-sm font-medium text-violet-600">
            Ver todos
          </Link>
        </div>

        {latestOutfits.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-9 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-xl">
              ♡
            </div>

            <p className="mt-3 text-sm font-semibold text-zinc-800">
              Aún no tienes looks guardados
            </p>

            <p className="mx-auto mt-1 max-w-[250px] text-xs leading-5 text-zinc-500">
              Crea tu primera combinación y aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {latestOutfits.map((outfit) => (
              <Link
                key={outfit.id}
                to="/outfits"
                className="flex items-center justify-between rounded-3xl bg-white px-5 py-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{outfit.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Intl.DateTimeFormat('es-PA', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(outfit.createdAt))}
                  </p>
                </div>
                <span className="text-lg text-violet-500">›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
