import { Link } from 'react-router'

export default function ClosetPage() {
  return (
    <div className="px-4 pt-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Colección</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mi Closet
          </h1>
        </div>

        <Link
          to="/closet/new"
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Prenda
        </Link>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-3xl">
          👕
        </div>

        <h2 className="mt-4 font-semibold">
          Tu closet está vacío
        </h2>

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
    </div>
  )
}
