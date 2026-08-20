import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import ClothingIcon, { type ClothingIconKind } from '../../../../shared/components/ClothingIcon'
import UiIcon from '../../../../shared/components/UiIcon'
import type { Garment } from '../../../wardrobe/domain/Garment'
import { createOutfit } from '../../application/createOutfit'
import type { OutfitSlot } from '../../domain/Outfit'
import GarmentImage from '../components/GarmentImage'

const slotDefinitions: Array<{ slot: OutfitSlot; label: string; icon: ClothingIconKind }> = [
  { slot: 'top', label: 'Tops', icon: 'top' },
  { slot: 'bottom', label: 'Bottoms', icon: 'bottom' },
  { slot: 'shoes', label: 'Calzado', icon: 'shoes' },
  { slot: 'accessory', label: 'Accesorios', icon: 'accessory' },
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
      <header className="grid grid-cols-[40px_1fr_56px] items-center">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-700 transition active:scale-95 dark:text-slate-200"
          aria-label="Volver"
        >
          <UiIcon name="arrow-left" className="h-5 w-5" />
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
          const count = garmentsBySlot[definition.slot].length

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
              <ClothingIcon kind={definition.icon} className="h-6 w-6" />
              <span className="max-w-full truncate">{definition.label}</span>
              <span className="text-[8px] font-semibold opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      <section className="mt-3 rounded-[28px] border border-black/[0.04] bg-gradient-to-b from-[#fffdfd] via-[#fbf9ff] to-[#fff7fc] p-3 shadow-[0_18px_50px_rgba(57,35,94,0.08)] dark:border-white/[0.07] dark:from-[#0b1525] dark:via-[#091321] dark:to-[#0d1321]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold text-zinc-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-slate-300">
            <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />
            <span className="truncate">{activeGarment ? activeGarment.name : 'Sin prenda'}</span>
          </div>

          {activeTotal > 0 && (
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-zinc-400 dark:text-slate-500">
              {activeIndex + 1}/{activeTotal}
            </span>
          )}
        </div>

        <div className="relative mt-3 grid h-[326px] grid-cols-[minmax(0,1fr)_82px] gap-2 sm:h-[350px]">
          <span className="pointer-events-none absolute left-4 top-16 z-10 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]" />
          <span className="pointer-events-none absolute right-24 top-4 z-10 h-1 w-1 rounded-full bg-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,0.8)]" />
          <span className="pointer-events-none absolute bottom-14 right-24 z-10 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.8)]" />

          <div className="grid min-w-0 grid-rows-[108px_minmax(0,1fr)] gap-2">
            <LookPiece
              slot="top"
              garment={selectedGarment('top')}
              active={activeSlot === 'top'}
              onSelect={() => setActiveSlot('top')}
              imageClassName="max-h-[96px] max-w-[148px]"
            />

            <LookPiece
              slot="bottom"
              garment={selectedGarment('bottom')}
              active={activeSlot === 'bottom'}
              onSelect={() => setActiveSlot('bottom')}
              imageClassName="max-h-[198px] max-w-[166px]"
            />
          </div>

          <div className="grid min-w-0 grid-rows-2 gap-2">
            <LookPiece
              slot="accessory"
              garment={selectedGarment('accessory')}
              active={activeSlot === 'accessory'}
              onSelect={() => setActiveSlot('accessory')}
              imageClassName="max-h-[118px] max-w-[70px]"
            />

            <LookPiece
              slot="shoes"
              garment={selectedGarment('shoes')}
              active={activeSlot === 'shoes'}
              onSelect={() => setActiveSlot('shoes')}
              imageClassName="max-h-[118px] max-w-[70px]"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[42px_42px_1fr] gap-2">
          <button
            type="button"
            disabled={activeTotal <= 1}
            onClick={() => cycleGarment(activeSlot, -1)}
            className="flex h-10 items-center justify-center rounded-xl border border-black/[0.06] bg-white/90 text-zinc-700 shadow-sm disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e]/90 dark:text-white"
            aria-label="Prenda anterior"
          >
            <UiIcon name="chevron-left" className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled={activeTotal <= 1}
            onClick={() => cycleGarment(activeSlot, 1)}
            className="flex h-10 items-center justify-center rounded-xl border border-black/[0.06] bg-white/90 text-zinc-700 shadow-sm disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e]/90 dark:text-white"
            aria-label="Prenda siguiente"
          >
            <UiIcon name="chevron-right" className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled={garments.length === 0}
            onClick={randomizeLook}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.06] bg-white/90 px-3 text-[10px] font-extrabold text-zinc-700 shadow-sm disabled:opacity-30 dark:border-white/10 dark:bg-[#111c2e]/90 dark:text-slate-200"
          >
            <UiIcon name="shuffle" className="h-4 w-4" />
            Aleatorio
          </button>
        </div>
      </section>

      {error && (
        <p
          className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="sticky bottom-[72px] z-40 mt-3 rounded-[20px] border border-black/[0.06] bg-white/95 p-2 shadow-[0_12px_35px_rgba(52,36,86,0.16)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1525]/95">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setError(undefined)
            setIsSaveOpen(true)
          }}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Guardar look
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
  slot,
  garment,
  active,
  onSelect,
  imageClassName,
}: {
  slot: OutfitSlot
  garment?: Garment
  active: boolean
  onSelect: () => void
  imageClassName: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[22px] border p-2 transition',
        active
          ? 'border-violet-400 bg-violet-50/55 ring-4 ring-violet-400/10 dark:border-fuchsia-400 dark:bg-violet-500/[0.08]'
          : 'border-transparent bg-white/35 dark:bg-white/[0.025]',
      ].join(' ')}
      aria-label={`Seleccionar ${slot}`}
    >
      {garment ? (
        <GarmentImage
          imageId={garment.imageId}
          alt={garment.name}
          className={[
            'h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal',
            imageClassName,
          ].join(' ')}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-[18px] border border-dashed border-zinc-200 text-zinc-300 dark:border-white/10 dark:text-slate-600">
          <ClothingIcon kind={slot as ClothingIconKind} className="h-8 w-8 opacity-45" />
        </span>
      )}
    </button>
  )
}

function randomIndex(total: number) {
  if (total <= 1) return 0
  return Math.floor(Math.random() * total)
}
