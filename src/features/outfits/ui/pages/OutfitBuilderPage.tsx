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
    <div className="px-3 pt-4">
      <header className="grid grid-cols-[40px_1fr_52px] items-center">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-700 transition active:scale-95 dark:text-slate-200"
          aria-label="Volver"
        >
          ←
        </Link>
        <h1 className="text-center text-base font-extrabold tracking-tight text-zinc-950 dark:text-white">Crear Outfit</h1>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => setIsSaveOpen(true)}
          className="text-right text-[11px] font-extrabold text-violet-600 disabled:opacity-30 dark:text-fuchsia-400"
        >
          Guardar
        </button>
      </header>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {slotDefinitions.map((definition) => {
          const active = definition.slot === activeSlot
          return (
            <button
              key={definition.slot}
              type="button"
              onClick={() => setActiveSlot(definition.slot)}
              className={[
                'flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-bold transition',
                active
                  ? 'bg-violet-50 text-violet-600 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-fuchsia-300 dark:ring-violet-400/20'
                  : 'text-zinc-500 dark:text-slate-500',
              ].join(' ')}
            >
              <span className="text-xl">{definition.icon}</span>
              <span className="truncate">{definition.label}</span>
            </button>
          )
        })}
      </div>

      <section className="relative mt-3 h-[430px] overflow-hidden rounded-[28px] border border-black/[0.04] bg-gradient-to-b from-[#fffdfd] via-[#fbf9ff] to-[#fff7fc] shadow-[0_18px_50px_rgba(57,35,94,0.08)] dark:border-white/[0.07] dark:from-[#0b1525] dark:via-[#091321] dark:to-[#0d1321]">
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-zinc-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />
          {activeGarment ? activeGarment.name : 'Sin prenda'}
          {activeTotal > 0 && <span className="text-zinc-400 dark:text-slate-500">{activeIndex + 1}/{activeTotal}</span>}
        </div>

        <span className="absolute left-8 top-28 text-amber-400">✦</span>
        <span className="absolute right-8 top-20 text-amber-400">✦</span>
        <span className="absolute right-16 top-60 text-amber-400">✦</span>

        <LookPiece
          slot="top"
          garment={selectedGarment('top')}
          active={activeSlot === 'top'}
          onSelect={() => setActiveSlot('top')}
          className="left-1/2 top-[62px] h-[118px] w-[150px] -translate-x-1/2"
        />
        <LookPiece
          slot="bottom"
          garment={selectedGarment('bottom')}
          active={activeSlot === 'bottom'}
          onSelect={() => setActiveSlot('bottom')}
          className="left-1/2 top-[178px] h-[190px] w-[168px] -translate-x-1/2"
        />
        <LookPiece
          slot="accessory"
          garment={selectedGarment('accessory')}
          active={activeSlot === 'accessory'}
          onSelect={() => setActiveSlot('accessory')}
          className="right-5 top-[108px] h-[88px] w-[88px]"
        />
        <LookPiece
          slot="shoes"
          garment={selectedGarment('shoes')}
          active={activeSlot === 'shoes'}
          onSelect={() => setActiveSlot('shoes')}
          className="bottom-8 right-5 h-[92px] w-[92px]"
        />

        <button
          type="button"
          disabled={activeTotal <= 1}
          onClick={() => cycleGarment(activeSlot, -1)}
          className="absolute bottom-7 left-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-white/90 text-2xl text-zinc-700 shadow-md backdrop-blur disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e]/90 dark:text-white"
          aria-label="Prenda anterior"
        >
          ‹
        </button>

        <button
          type="button"
          disabled={activeTotal <= 1}
          onClick={() => cycleGarment(activeSlot, 1)}
          className="absolute bottom-7 left-[68px] flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-white/90 text-2xl text-zinc-700 shadow-md backdrop-blur disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e]/90 dark:text-white"
          aria-label="Prenda siguiente"
        >
          ›
        </button>

        <button
          type="button"
          disabled={garments.length === 0}
          onClick={randomizeLook}
          className="absolute bottom-7 right-[110px] flex h-11 items-center gap-2 rounded-2xl border border-black/[0.06] bg-white/90 px-3 text-[10px] font-extrabold text-zinc-700 shadow-md backdrop-blur disabled:opacity-30 dark:border-white/10 dark:bg-[#111c2e]/90 dark:text-slate-200"
        >
          ⇄ Aleatorio
        </button>
      </section>

      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>
      )}

      <div className="sticky bottom-[74px] z-40 mt-3 grid grid-cols-[48px_1fr_48px] gap-2 rounded-[20px] border border-black/[0.06] bg-white/95 p-2 shadow-[0_12px_35px_rgba(52,36,86,0.16)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1525]/95">
        <button type="button" className="rounded-2xl border border-zinc-200 text-lg text-zinc-600 dark:border-white/10 dark:text-slate-300" aria-label="Compartir">↥</button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setError(undefined)
            setIsSaveOpen(true)
          }}
          className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Guardar look
        </button>
        <button type="button" onClick={randomizeLook} className="rounded-2xl border border-zinc-200 text-lg text-zinc-600 dark:border-white/10 dark:text-slate-300" aria-label="Aleatorio">•••</button>
      </div>

      {!canSave && <p className="mt-2 text-center text-[10px] text-zinc-400 dark:text-slate-500">Necesitas al menos dos categorías con prendas para guardar.</p>}

      {isSaveOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl dark:bg-[#0d1829]" role="dialog" aria-modal="true" aria-labelledby="save-look-title">
            <h2 id="save-look-title" className="text-lg font-extrabold text-zinc-900 dark:text-white">Guardar look</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-slate-400">Ponle un nombre o déjalo vacío para generar uno automáticamente.</p>

            <form onSubmit={handleSave} className="mt-5">
              <label htmlFor="look-name" className="text-xs font-bold text-zinc-700 dark:text-slate-300">Nombre</label>
              <input
                id="look-name"
                value={lookName}
                onChange={(event) => setLookName(event.target.value)}
                placeholder="Ej. Casual para salir"
                autoFocus
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#111c2e] dark:text-white"
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={isSaving} onClick={() => setIsSaveOpen(false)} className="rounded-2xl border border-zinc-200 py-3 text-sm font-bold text-zinc-700 dark:border-white/10 dark:text-slate-300">Cancelar</button>
                <button type="submit" disabled={isSaving} className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-extrabold text-white disabled:opacity-50">
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
  slot: OutfitSlot
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
        'absolute overflow-hidden rounded-[24px] border bg-white/72 p-1.5 shadow-sm backdrop-blur transition dark:bg-white/[0.04]',
        active
          ? 'border-violet-400 ring-4 ring-violet-400/10 dark:border-fuchsia-400'
          : 'border-black/[0.04] dark:border-white/[0.06]',
        className,
      ].join(' ')}
    >
      {garment ? (
        <GarmentImage imageId={garment.imageId} alt={garment.name} className="h-full w-full rounded-[18px] object-contain" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-[18px] border border-dashed border-zinc-200 text-2xl text-zinc-300 dark:border-white/10 dark:text-slate-600">＋</span>
      )}
    </button>
  )
}

function randomIndex(total: number) {
  if (total <= 1) return 0
  return Math.floor(Math.random() * total)
}
