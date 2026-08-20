import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import BrandMark from '../../../../shared/components/BrandMark'
import ClothingIcon, { type ClothingIconKind } from '../../../../shared/components/ClothingIcon'
import UiIcon from '../../../../shared/components/UiIcon'

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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500 dark:text-fuchsia-400">My Virtual Closet</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Inicio</h1>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-[#0d1829] dark:ring-white/[0.06]">
          <BrandMark compact />
        </div>
      </header>

      <section className="mt-4">
        <h2 className="text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white">Tu closet, tu estilo.</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-slate-400">Combina lo que ya tienes y crea algo diferente.</p>
      </section>

      <section className="relative mt-4 overflow-hidden rounded-[26px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400 p-5 text-white shadow-[0_18px_40px_rgba(168,85,247,0.24)]">
        <div className="absolute -right-9 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-14 left-20 h-32 w-32 rounded-full bg-pink-200/20 blur-2xl" />

        <div className="relative z-10 max-w-[58%]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <UiIcon name="sparkles" className="h-4 w-4" />
          </div>
          <p className="mt-3 text-base font-extrabold">Crea tu próximo look</p>
          <p className="mt-2 text-xs leading-5 text-white/85">
            Mezcla tus prendas y arma combinaciones únicas con lo que ya tienes.
          </p>

          <Link
            to="/outfit"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-xs font-extrabold text-violet-700 shadow-lg shadow-violet-900/10 transition active:scale-[0.98]"
          >
            Crear outfit
            <span className="text-base leading-none" aria-hidden="true">＋</span>
          </Link>
        </div>

        <div className="absolute bottom-4 right-4 grid w-[128px] grid-cols-2 gap-2" aria-hidden="true">
          <HeroIcon kind="top" />
          <HeroIcon kind="accessory" />
          <HeroIcon kind="bottom" />
          <HeroIcon kind="shoes" />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white">Resumen de tu closet</h2>
          <Link to="/closet" className="text-xs font-bold text-fuchsia-500">Ver todo</Link>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <SummaryCard label="Prendas" value={totalGarments} icon="top" tone="violet" />
          <SummaryCard label="Zapatos" value={shoesCount} icon="shoes" tone="pink" />
          <SummaryCard label="Accesorios" value={accessoriesCount} icon="accessory" tone="amber" />
        </div>
      </section>

      <section className="mt-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white">Looks guardados</h2>
          <Link to="/outfits" className="text-xs font-bold text-fuchsia-500">Ver todos</Link>
        </div>

        {latestOutfits.length === 0 ? (
          <div className="mt-3 rounded-[22px] border border-dashed border-zinc-200 bg-white px-5 py-7 text-center shadow-sm dark:border-white/10 dark:bg-[#0d1829]">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-fuchsia-300">
              <UiIcon name="heart" className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-zinc-800 dark:text-slate-100">Aún no tienes looks guardados</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-slate-500">Tu primera combinación aparecerá aquí.</p>
          </div>
        ) : (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {latestOutfits.map((outfit, index) => (
              <Link
                key={outfit.id}
                to="/outfits"
                className="min-w-[138px] overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-sm transition active:scale-[0.99] dark:border-white/[0.07] dark:bg-[#0d1829]"
              >
                <LookPreview variant={index % 3} />
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

function HeroIcon({ kind }: { kind: ClothingIconKind }) {
  return (
    <span className="flex h-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner shadow-white/10 backdrop-blur">
      <ClothingIcon kind={kind} className="h-9 w-9 drop-shadow-sm" />
    </span>
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
  icon: ClothingIconKind
  tone: 'violet' | 'pink' | 'amber'
}) {
  const toneClass = {
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    pink: 'bg-pink-50 text-pink-500 dark:bg-pink-500/10 dark:text-pink-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  }[tone]

  return (
    <div className={`rounded-[18px] p-3 ${toneClass}`}>
      <div className="flex items-center gap-1.5">
        <ClothingIcon kind={icon} className="h-5 w-5" />
        <span className="text-[10px] font-bold">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
    </div>
  )
}

function LookPreview({ variant }: { variant: number }) {
  const palette = [
    'from-violet-100 via-fuchsia-50 to-pink-100 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-pink-500/10',
    'from-sky-100 via-violet-50 to-fuchsia-100 dark:from-sky-500/10 dark:via-violet-500/10 dark:to-fuchsia-500/10',
    'from-amber-100 via-pink-50 to-violet-100 dark:from-amber-400/10 dark:via-pink-500/10 dark:to-violet-500/10',
  ][variant]

  return (
    <div className={`grid h-24 grid-cols-2 gap-1.5 bg-gradient-to-br p-2.5 ${palette}`} aria-hidden="true">
      <span className="flex items-center justify-center rounded-xl bg-white/60 text-violet-600 dark:bg-white/[0.04] dark:text-violet-300">
        <ClothingIcon kind="top" className="h-8 w-8" />
      </span>
      <span className="flex items-center justify-center rounded-xl bg-white/60 text-fuchsia-500 dark:bg-white/[0.04] dark:text-fuchsia-300">
        <ClothingIcon kind="accessory" className="h-8 w-8" />
      </span>
      <span className="flex items-center justify-center rounded-xl bg-white/60 text-indigo-500 dark:bg-white/[0.04] dark:text-indigo-300">
        <ClothingIcon kind="bottom" className="h-8 w-8" />
      </span>
      <span className="flex items-center justify-center rounded-xl bg-white/60 text-pink-500 dark:bg-white/[0.04] dark:text-pink-300">
        <ClothingIcon kind="shoes" className="h-8 w-8" />
      </span>
    </div>
  )
}
