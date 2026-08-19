import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'

export default function HomePage() {
  const garments = useLiveQuery(() => db.garments.toArray(), [], [])
  const latestOutfits = useLiveQuery(
    () => db.outfits.orderBy('createdAt').reverse().limit(3).toArray(),
    [],
    [],
  )

  const totalGarments = garments.length
  const shoesCount = garments.filter((garment) => garment.category === 'shoes').length
  const accessoriesCount = garments.filter((garment) => garment.category === 'accessory').length

  return (
    <div className="px-4 pt-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Inicio</h1>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm ring-1 ring-black/[0.04] dark:bg-[#0d1829] dark:text-slate-200 dark:ring-white/[0.06]"
          aria-label="Notificaciones"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white dark:ring-[#0d1829]" />
        </button>
      </header>

      <section className="mt-4">
        <h2 className="text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white">¡Hola, Fashionista! 💜</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-slate-400">¿Lista para crear looks increíbles?</p>
      </section>

      <section className="relative mt-4 overflow-hidden rounded-[26px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400 p-5 text-white shadow-[0_18px_40px_rgba(168,85,247,0.24)]">
        <div className="absolute -right-9 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-14 left-20 h-32 w-32 rounded-full bg-pink-200/20 blur-2xl" />

        <div className="relative z-10 max-w-[58%]">
          <p className="text-base font-extrabold">Crea tu próximo look</p>
          <p className="mt-2 text-xs leading-5 text-white/85">
            Mezcla tus prendas y arma outfits únicos con lo que ya tienes.
          </p>

          <Link
            to="/outfit"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-xs font-extrabold text-violet-700 shadow-lg shadow-violet-900/10 transition active:scale-[0.98]"
          >
            Crear outfit
            <span className="text-base leading-none">＋</span>
          </Link>
        </div>

        <div className="absolute bottom-4 right-4 grid w-[128px] grid-cols-2 gap-2" aria-hidden="true">
          <span className="flex h-14 items-center justify-center rounded-2xl bg-white/18 text-3xl backdrop-blur">👚</span>
          <span className="flex h-14 items-center justify-center rounded-2xl bg-white/18 text-3xl backdrop-blur">👜</span>
          <span className="flex h-14 items-center justify-center rounded-2xl bg-white/18 text-3xl backdrop-blur">👖</span>
          <span className="flex h-14 items-center justify-center rounded-2xl bg-white/18 text-3xl backdrop-blur">👟</span>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white">Resumen de tu closet</h2>
          <Link to="/closet" className="text-xs font-bold text-fuchsia-500">Ver todo</Link>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <SummaryCard label="Prendas" value={totalGarments} icon="👕" tone="violet" />
          <SummaryCard label="Zapatos" value={shoesCount} icon="👟" tone="pink" />
          <SummaryCard label="Accesorios" value={accessoriesCount} icon="👜" tone="amber" />
        </div>
      </section>

      <section className="mt-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white">Looks guardados</h2>
          <Link to="/outfits" className="text-xs font-bold text-fuchsia-500">Ver todos</Link>
        </div>

        {latestOutfits.length === 0 ? (
          <div className="mt-3 rounded-[22px] border border-dashed border-zinc-200 bg-white px-5 py-7 text-center shadow-sm dark:border-white/10 dark:bg-[#0d1829]">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-lg text-violet-600 dark:bg-violet-500/10 dark:text-fuchsia-300">♡</div>
            <p className="mt-3 text-sm font-bold text-zinc-800 dark:text-slate-100">Aún no tienes looks guardados</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-slate-500">Tu primera combinación aparecerá aquí.</p>
          </div>
        ) : (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {latestOutfits.map((outfit, index) => (
              <Link
                key={outfit.id}
                to="/outfits"
                className="min-w-[138px] overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]"
              >
                <div className="flex h-24 items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 text-4xl dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-amber-400/10">
                  {index % 3 === 0 ? '👚 👖' : index % 3 === 1 ? '🧥 👟' : '👕 👜'}
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-extrabold text-zinc-900 dark:text-white">{outfit.name}</p>
                  <p className="mt-1 text-[10px] text-zinc-400 dark:text-slate-500">
                    {new Intl.DateTimeFormat('es-PA', { day: '2-digit', month: 'short' }).format(new Date(outfit.createdAt))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: string
  tone: 'violet' | 'pink' | 'amber'
}) {
  const toneClass = {
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    pink: 'bg-pink-50 text-pink-500 dark:bg-pink-500/10 dark:text-pink-300',
    amber: 'bg-amber-50 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300',
  }[tone]

  return (
    <div className={`rounded-[18px] p-3 ${toneClass}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
    </div>
  )
}
