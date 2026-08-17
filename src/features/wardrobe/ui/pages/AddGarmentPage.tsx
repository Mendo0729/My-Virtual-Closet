import { Link } from 'react-router'

export default function AddGarmentPage() {
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/closet"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          ←
        </Link>

        <h1 className="text-xl font-semibold">
          Agregar prenda
        </h1>
      </div>

      <div className="mt-7 rounded-[28px] border-2 border-dashed border-violet-200 bg-violet-50/50 px-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          📷
        </div>

        <h2 className="mt-4 text-lg font-semibold">
          Toma una foto
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          o selecciona una imagen de tu galería
        </p>

        <button className="mt-7 w-full rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white">
          Usar cámara
        </button>

        <button className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700">
          Elegir de la galería
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">
          Consejos para una mejor foto
        </p>

        <ul className="mt-4 space-y-3 text-sm text-zinc-500">
          <li>• Usa un fondo limpio.</li>
          <li>• Procura tener buena iluminación.</li>
          <li>• Asegúrate de que toda la prenda sea visible.</li>
        </ul>
      </div>
    </div>
  )
}
