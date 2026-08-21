import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import ClothingIcon, { type ClothingIconKind } from '../../../../shared/components/ClothingIcon'
import UiIcon from '../../../../shared/components/UiIcon'
import type { Garment } from '../../../wardrobe/domain/Garment'
import { createOutfit } from '../../application/createOutfit'
import type { OutfitCategory, OutfitSlot } from '../../domain/Outfit'
import GarmentImage from '../components/GarmentImage'

const slotDefinitions: Array<{ slot: OutfitSlot; label: string; icon: ClothingIconKind }> = [
  { slot: 'top', label: 'Top', icon: 'top' },
  { slot: 'bottom', label: 'Bottom', icon: 'bottom' },
  { slot: 'shoes', label: 'Zapatos', icon: 'shoes' },
  { slot: 'accessory', label: 'Accesorio', icon: 'accessory' },
]

const categoryOptions: Array<{ value: OutfitCategory; label: string }> = [
  { value: 'casual', label: 'Casual' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'noche', label: 'Noche' },
  { value: 'deporte', label: 'Deporte' },
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
  const [lookCategory, setLookCategory] = useState<OutfitCategory>('casual')
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

  const activeDefinition = slotDefinitions.find((definition) => definition.slot === activeSlot) ?? slotDefinitions[0]
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
        category: lookCategory,
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

        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-500 dark:text-fuchsia-400">Combina tu closet</p>
          <h1 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Crear Outfit
          </h1>
        </div>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => setIsSaveOpen(true)}
          className="text-right text-[11px] font-extrabold text-violet-600 disabled:opacity-30 dark:text-fuchsia-400"
        >
          Guardar
        </button>
      </header>

      <section className="mt-4 rounded-[28px] border border-black/[0.05] bg-gradient-to-b from-white via-[#fdfcff] to-[#fff9fc] p-3 shadow-[0_18px_50px_rgba(57,35,94,0.08)] dark:border-white/[0.07] dark:from-[#0b1525] dark:via-[#091321] dark:to-[#0d1321]">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-slate-500">Seleccionado</p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-zinc-800 dark:text-white">
              {activeDefinition.label} · {activeGarment?.name ?? 'Sin prenda'}
            </p>
          </div>

          {activeTotal > 0 && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-extrabold tabular-nums text-zinc-500 dark:bg-white/[0.06] dark:text-slate-400">
              {activeIndex + 1}/{activeTotal}
            </span>
          )}
        </div>

        <div className="grid min-h-[430px] grid-cols-2 gap-3">
          <div className="grid min-w-0 grid-rows-[116px_154px_116px] gap-3">
            <LookPiece
              slot="top"
              label="Top"
              garment={selectedGarment('top')}
              active={activeSlot === 'top'}
              onSelect={() => setActiveSlot('top')}
              imageClassName="max-h-[88px] max-w-[138px]"
            />

            <LookPiece
              slot="bottom"
              label="Bottom"
              garment={selectedGarment('bottom')}
              active={activeSlot === 'bottom'}
              onSelect={() => setActiveSlot('bottom')}
              imageClassName="max-h-[125px] max-w-[138px]"
            />

            <LookPiece
              slot="shoes"
              label="Zapatos"
              garment={selectedGarment('shoes')}
              active={activeSlot === 'shoes'}
              onSelect={() => setActiveSlot('shoes')}
              imageClassName="max-h-[86px] max-w-[140px]"
            />
          </div>

          <div className="grid min-w-0 grid-rows-[174px_174px] gap-3 pt-6">
            <JacketPlaceholder />

            <LookPiece
              slot="accessory"
              label="Accesorio"
              garment={selectedGarment('accessory')}
              active={activeSlot === 'accessory'}
              onSelect={() => setActiveSlot('accessory')}
              imageClassName="max-h-[132px] max-w-[132px]"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[44px_1fr_44px] gap-2">
          <button
            type="button"
            disabled={activeTotal <= 1}
            onClick={() => cycleGarment(activeSlot, -1)}
            className="flex h-11 items-center justify-center rounded-2xl border border-black/[0.07] bg-white text-zinc-700 shadow-sm transition active:scale-95 disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e] dark:text-white"
            aria-label="Prenda anterior"
          >
            <UiIcon name="chevron-left" className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled={garments.length === 0}
            onClick={randomizeLook}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/[0.07] bg-white px-3 text-[10px] font-extrabold text-zinc-700 shadow-sm transition active:scale-[0.98] disabled:opacity-30 dark:border-white/10 dark:bg-[#111c2e] dark:text-slate-200"
          >
            <UiIcon name="shuffle" className="h-4 w-4" />
            Mezclar outfit
          </button>

          <button
            type="button"
            disabled={activeTotal <= 1}
            onClick={() => cycleGarment(activeSlot, 1)}
            className="flex h-11 items-center justify-center rounded-2xl border border-black/[0.07] bg-white text-zinc-700 shadow-sm transition active:scale-95 disabled:opacity-25 dark:border-white/10 dark:bg-[#111c2e] dark:text-white"
            aria-label="Prenda siguiente"
          >
            <UiIcon name="chevron-right" className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 px-1 text-center text-[9px] leading-4 text-zinc-400 dark:text-slate-500">
          Toca una tarjeta para cambiar esa parte del outfit con las flechas.
        </p>
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
              Ponle un nombre, elige una categoría y guarda tu combinación.
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

              <fieldset className="mt-4">
                <legend className="text-xs font-bold text-zinc-700 dark:text-slate-300">Categoría</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {categoryOptions.map((option) => {
                    const active = lookCategory === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLookCategory(option.value)}
                        className={[
                          'rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition',
                          active
                            ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-fuchsia-400 dark:bg-violet-500/15 dark:text-fuchsia-300'
                            : 'border-zinc-200 bg-white text-zinc-500 dark:border-white/10 dark:bg-[#111c2e] dark:text-slate-400',
                        ].join(' ')}
                        aria-pressed={active}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

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
  label,
  garment,
  active,
  onSelect,
  imageClassName,
}: {
  slot: OutfitSlot
  label: string
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
        'group relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[20px] border bg-white p-2.5 shadow-[0_7px_18px_rgba(46,35,72,0.05)] transition active:scale-[0.985] dark:bg-[#111c2e]',
        active
          ? 'border-violet-500 ring-4 ring-violet-400/10 dark:border-fuchsia-400'
          : 'border-zinc-200/90 dark:border-white/10',
      ].join(' ')}
      aria-label={`Seleccionar ${label}`}
      aria-pressed={active}
    >
      <span
        className={[
          'absolute left-2.5 top-2.5 z-10 rounded-full px-2 py-1 text-[9px] font-extrabold backdrop-blur',
          active
            ? 'bg-violet-600 text-white dark:bg-fuchsia-500'
            : 'bg-white/90 text-zinc-700 shadow-sm dark:bg-[#0d1829]/90 dark:text-slate-300',
        ].join(' ')}
      >
        {label}
      </span>

      {garment ? (
        <GarmentImage
          imageId={garment.imageId}
          alt={garment.name}
          className={[
            'h-full w-full object-contain mix-blend-multiply transition-transform group-active:scale-[0.98] dark:mix-blend-normal',
            imageClassName,
          ].join(' ')}
        />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-zinc-200 text-zinc-300 dark:border-white/10 dark:text-slate-600">
          <ClothingIcon kind={slot as ClothingIconKind} className="h-8 w-8 opacity-45" />
          <span className="text-[9px] font-bold">Sin prendas</span>
        </span>
      )}
    </button>
  )
}

function JacketPlaceholder() {
  return (
    <div className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-zinc-200 bg-zinc-50/70 p-3 text-center dark:border-white/10 dark:bg-white/[0.025]">
      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-1 text-[9px] font-extrabold text-zinc-600 shadow-sm dark:bg-[#0d1829]/90 dark:text-slate-400">
        Chaqueta
      </span>
      <div className="mt-5">
        <div className="mx-auto h-10 w-12 rounded-xl border border-zinc-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]" />
        <p className="mt-2 text-[9px] font-bold text-zinc-400 dark:text-slate-500">Próximamente</p>
      </div>
    </div>
  )
}

function randomIndex(total: number) {
  if (total <= 1) return 0
  return Math.floor(Math.random() * total)
}
