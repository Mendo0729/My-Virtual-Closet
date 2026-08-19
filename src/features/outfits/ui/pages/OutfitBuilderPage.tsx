import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import type { Garment } from '../../../wardrobe/domain/Garment'
import { createOutfit } from '../../application/createOutfit'
import type { OutfitSlot } from '../../domain/Outfit'
import GarmentImage from '../components/GarmentImage'

const slotDefinitions: Array<{ slot: OutfitSlot; label: string; icon: string }> = [
  { slot: 'top', label: 'Tops', icon: '👚' },
  { slot: 'bottom', label: 'Bottoms', icon: '👖' },
  { slot: 'shoes', label: 'Calzado', icon: '👟' },
  { slot: 'accessory', label: 'Accesorios', icon: '👜' },
]

const initialIndexes: Record<OutfitSlot, number> = {
  top: 0,
  bottom: 0,
  shoes: 0,
  accessory: 0,
}

export default function OutfitBuilderPage() {
  const navigate = useNavigate()
  const garments = useLiveQuery(() => db.garments.toArray(), []) ?? []
  const [indexes, setIndexes] = useState<Record<OutfitSlot, number>>(initialIndexes)
  const [activeSlot, setActiveSlot] = useState<OutfitSlot>('top')
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [lookName, setLookName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  const garmentsBySlot = useMemo<Record<OutfitSlot, Garment[]>>(
    () => ({
      top: garments.filter((garment) => garment.category === 'top'),
      bottom: garments.filter((garment) => garment.category === 'bottom'),
      shoes: garments.filter((garment) => garment.category === 'shoes'),
      accessory: garments.filter((garment) => garment.category === 'accessory'),
    }),
    [garments],
  )

  function getSafeIndex(slot: OutfitSlot) {
    const total = garmentsBySlot[slot].length
    return total === 0 ? 0 : indexes[slot] % total
  }

  function selectedGarment(slot: OutfitSlot) {
    const options = garmentsBySlot[slot]
    return options[getSafeIndex(slot)]
  }

  function cycleGarment(slot: OutfitSlot, direction: -1 | 1) {
    const total = garmentsBySlot[slot].length
    if (total <= 1) return

    setIndexes((current) => {
      const safeCurrent = current[slot] % total

      return {
        ...current,
        [slot]: (safeCurrent + direction + total) % total,
      }
    })
  }

  function randomizeLook() {
    setIndexes({
      top: randomIndex(garmentsBySlot.top.length),
      bottom: randomIndex(garmentsBySlot.bottom.length),
      shoes: randomIndex(garmentsBySlot.shoes.length),
      accessory: randomIndex(garmentsBySlot.accessory.length),
    })
  }

  const selectedItems = slotDefinitions.reduce<Array<{ slot: OutfitSlot; garment: Garment }>>(
    (items, definition) => {
      const garment = selectedGarment(definition.slot)
      if (garment) items.push({ slot: definition.slot, garment })
      return items
    },
    [],
  )

  const activeGarment = selectedGarment(activeSlot)
  const activeTotal = garmentsBySlot[activeSlot].length
  const activeIndex = getSafeIndex(activeSlot)
  const canSave = selectedItems.length >= 2

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      setError('Selecciona al menos dos prendas para guardar un look.')
      return
    }

    setError(undefined)
    setIsSaving(true)

    try {
      await createOutfit({
        name: lookName,
        items: selectedItems.map(({ slot, garment }, position) => ({
          garmentId: garment.id,
          slot,
          position,
        })),
      })

      navigate('/outfits')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el look.')
      setIsSaving(false)
    }
  }

  return (
    <div className="px-3 pt-3">
      <header className="grid grid-cols-[40px_1fr_52px] items-center">
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-700 transition active:scale-95 dark:text-slate-200"
          aria-label="Volver"
        >
          ←
        </Link>

        <h1 className="text-center text-base font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Crear Outfit
        </h1>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => setIsSaveOpen(true)}
          className="text-right text-[11px] font-extrabold text-violet-600 disabled:opacity-30 dark:text-fuchsia-400"
        >
          Guardar
        </button>
      </header>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {slotDefinitions.map((definition) => {
          const active = definition.slot === activeSlot

          return (
            <button
              key={definition.slot}
              type="button"
              onClick={() => setActiveSlot(definition.slot)}
              className={[
                'flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[9px] font-bold transition',
                active
                  ? 'bg-violet-50 text-violet-600 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-fuchsia-300 dark:ring-violet-400/20'
                  : 'text-zinc-500 dark:text-slate-500',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{definition.icon}</span>
              <span className="truncate">{definition.label}</span>
            </button>
          )
        })}
      </div>

      <section className="relative mt-3 h-[330px] overflow-hidden rounded-[26px] border border-black/[0.04] bg-gradient-to-b from-[#fffdfd] via-[#fbf9ff] to-[#fff7fc] shadow-[0_14px_40px_rgba(57,35,94,0.08)] dark:border-white/[0.07] dark:from-[#0b1525] dark:via-[#091321] dark:to-[#0d1321]">
        <div className="absolute left-4 top-4 z-10 flex max-w-[190px] items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold text-zinc-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-slate-300">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />
          <span className="truncate">{activeGarment ? activeGarment.name : 'Sin prenda'}</span>
          {activeTotal > 0 && (
            <span className="shrink-0 text-zinc-400 dark:text-slate-500">
              {activeIndex + 1}/{activeTotal}
            </span>
          )}
        </div>

        <span className="absolute left-7 top-[92px] text-sm text-amber-400">✦</span>
        <span className="absolute right-8 top-[66px] text-sm text-amber-400">✦</span>
        <span className="absolute right-[86px] bottom-[42px] text-sm text-amber-400">✦</span>

        <LookPiece
          garment={selectedGarment('top')}
          active={activeSlot === 'top'}
          onSelect={() => setActiveSlot('top')}
          className="left-1/2 top-[48px] h-[88px] w-[112px] -translate-x-1/2"
        />

        <LookPiece
          garment={selectedGarment('bottom')}
          active={activeSlot === 'bottom'}
          onSelect={() => setActiveSlot('bottom')}
          className="left-1/2 top-[136px] h-[142px] w-[118px] -translate-x-1/2"
        />

        <LookPiece
          garment={selectedGarment('accessory')}
          active={activeSlot === 'accessory'}
          onSelect={() => setActiveSlot('accessory')}
          className="right-4 top-[92px] h-[70px] w-[70px]"
        />

        <LookPiece
          garment={selectedGarment('shoes')}
          active={activeSlot === 'shoes'}
          onSelect={() => setActiveSlot('shoes')}
          className="bottom-4 right-4 h-[72px] w-[72px]"
        />
      </section>

      <div className="mt-2 grid grid-cols-[42px_42px_1fr] gap-2">
        <button
          type="button"
          disabled={activeTotal <= 1}
          onClick={() => cycleGarment(activeSlot, -1)}
          className="flex h-10 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-xl text-zinc-700 shadow-sm disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e] dark:text-white"
          aria-label="Prenda anterior"
        >
          ‹
        </button>

        <button
          type="button"
          disabled={activeTotal <= 1}
          onClick={() => cycleGarment(activeSlot, 1)}
          className="flex h-10 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-xl text-zinc-700 shadow-sm disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e] dark:text-white"
          aria-label="Prenda siguiente"
        >
          ›
        </button>

        <button
          type="button"
          disabled={garments.length === 0}
          onClick={randomizeLook}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 text-[11px] font-extrabold text-zinc-700 shadow-sm disabled:opacity-30 dark:border-white/10 dark:bg-[#111c2e] dark:text-slate-200"
        >
          ⇄ Aleatorio
        </button>
      </div>

      {error && (
        <p
          className="mt-2 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="sticky bottom-[74px] z-40 mt-2 grid grid-cols-[44px_1fr_44px] gap-2 rounded-[18px] border border-black/[0.06] bg-white/95 p-2 shadow-[0_10px_30px_rgba(52,36,86,0.14)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1525]/95">
        <button
          type="button"
          className="rounded-xl border border-zinc-200 text-base text-zinc-600 dark:border-white/10 dark:text-slate-300"
          aria-label="Compartir"
        >
          ↥
        </button>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setError(undefined)
            setIsSaveOpen(true)
          }}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Guardar look
        </button>

        <button
          type="button"
          onClick={randomizeLook}
          className="rounded-xl border border-zinc-200 text-base text-zinc-600 dark:border-white/10 dark:text-slate-300"
          aria-label="Aleatorio"
        >
          ⋯
        </button>
      </div>

      {!canSave && (
        <p className="mt-2 text-center text-[10px] text-zinc-400 dark:text-slate-500">
          Necesitas al menos dos categorías con prendas para guardar.
        </p>
      )}

      {isSaveOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center">
          <div
            className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl dark:bg-[#0d1829]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-look-title"
          >
            <h2 id="save-look-title" className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Guardar look
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-slate-400">
              Ponle un nombre o déjalo vacío para generar uno automáticamente.
            </p>

            <form onSubmit={handleSave} className="mt-5">
              <label htmlFor="look-name" className="text-xs font-bold text-zinc-700 dark:text-slate-300">
                Nombre
              </label>

              <input
                id="look-name"
                value={lookName}
                onChange={(event) => setLookName(event.target.value)}
                placeholder="Ej. Casual para salir"
                autoFocus
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#111c2e] dark:text-white"
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsSaveOpen(false)}
                  className="rounded-2xl border border-zinc-200 py-3 text-sm font-bold text-zinc-700 dark:border-white/10 dark:text-slate-300"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  {isSaving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function LookPiece({
  garment,
  active,
  onSelect,
  className,
}: {
  garment?: Garment
  active: boolean
  onSelect: () => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'absolute overflow-hidden rounded-[20px] border bg-white/75 p-1.5 shadow-sm backdrop-blur transition dark:bg-white/[0.04]',
        active
          ? 'border-violet-400 ring-4 ring-violet-400/10 dark:border-fuchsia-400'
          : 'border-black/[0.04] dark:border-white/[0.06]',
        className,
      ].join(' ')}
    >
      {garment ? (
        <GarmentImage
          imageId={garment.imageId}
          alt={garment.name}
          className="h-full w-full rounded-[15px] object-contain"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-[15px] border border-dashed border-zinc-200 text-xl text-zinc-300 dark:border-white/10 dark:text-slate-600">
          ＋
        </span>
      )}
    </button>
  )
}

function randomIndex(total: number) {
  if (total <= 1) return 0
  return Math.floor(Math.random() * total)
}
