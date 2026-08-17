export default function SavedOutfitsPage() {
  return (
    <div className="px-4 pt-7">
      <p className="text-sm text-zinc-500">
        Combinaciones guardadas
      </p>

      <h1 className="text-2xl font-semibold tracking-tight">
        Mis Looks
      </h1>

      <div className="mt-7 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <div className="text-4xl">♡</div>

        <h2 className="mt-4 font-semibold">
          No tienes looks guardados
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Tus combinaciones favoritas aparecerán aquí.
        </p>
      </div>
    </div>
  )
}
