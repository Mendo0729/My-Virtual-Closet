const slots = [
  ['Top', '👚'],
  ['Bottom', '👖'],
  ['Zapatos', '👟'],
  ['Accesorio', '👜'],
]

export default function OutfitBuilderPage() {
  return (
    <div className="px-4 pt-7">
      <div className="text-center">
        <p className="text-sm font-medium text-violet-600">
          My Virtual Closet
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Construye tu look
        </h1>
      </div>

      <div className="mt-7 space-y-3">
        {slots.map(([name, icon]) => (
          <div
            key={name}
            className="grid grid-cols-[42px_1fr_42px] items-center gap-2 rounded-3xl bg-white p-3 shadow-sm"
          >
            <button className="h-11 rounded-xl border border-zinc-200 text-xl">
              ‹
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f5f1fa] text-4xl">
                {icon}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {name}
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Sin prendas
                </p>
              </div>
            </div>

            <button className="h-11 rounded-xl border border-zinc-200 text-xl">
              ›
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="rounded-2xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold">
          Aleatorio
        </button>

        <button className="rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white">
          Guardar look
        </button>
      </div>
    </div>
  )
}
