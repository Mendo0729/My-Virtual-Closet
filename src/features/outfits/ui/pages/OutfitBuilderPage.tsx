import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import type { Garment } from '../../../wardrobe/domain/Garment'
import { createOutfit } from '../../application/createOutfit'
import type { OutfitSlot } from '../../domain/Outfit'
import OutfitSlotCarousel from '../components/OutfitSlotCarousel'

const slotDefinitions: Array<{ slot: OutfitSlot; label: string }> = [
  { slot: 'top', label: 'Top' },
  { slot: 'bottom', label: 'Bottom' },
  { slot: 'shoes', label: 'Zapatos' },
  { slot: 'accessory', label: 'Accesorio' },
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

  function cycleGarment(slot: OutfitSlot, direction: -1 | 1) {
    const total = garmentsBySlot[slot].length

    if (total <= 1) {
      return
    }

    setIndexes((current) => {
      const safeCurrent = current[slot] % total
      const nextIndex = (safeCurrent + direction + total) % total

      return {
        ...current,
        [slot]: nextIndex,
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
      const options = garmentsBySlot[definition.slot]
      const garment = options[getSafeIndex(definition.slot)]

      if (garment) {
        items.push({ slot: definition.slot, garment })
      }

      return items
    },
    [],
  )

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
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium text-violet-600">My Virtual Closet</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">Construye tu look</h1>
        </div>

        <div className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-medium text-violet-700">
          {selectedItems.length} prendas
        </div>
      </div>

      <p className="mt-1.5 px-1 text-xs text-zinc-400">Combina tu outfit completo sin perderlo de vista.</p>

      <div className="mt-3 space-y-2.5">
        {slotDefinitions.map(({ slot, label }) => {
          const options = garmentsBySlot[slot]
          const currentIndex = getSafeIndex(slot)

          return (
            <OutfitSlotCarousel
              key={slot}
              label={label}
              garment={options[currentIndex]}
              currentIndex={currentIndex}
              total={options.length}
              onPrevious={() => cycleGarment(slot, -1)}
              onNext={() => cycleGarment(slot, 1)}
            />
          )
        })}
      </div>

      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!canSave && (
        <p className="mt-2 px-2 text-center text-[11px] leading-4 text-zinc-400">
          Agrega prendas en al menos dos categorías para guardar un look.
        </p>
      )}

      <div className="sticky bottom-[74px] z-40 -mx-1 mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-lg shadow-zinc-200/60 backdrop-blur">
        <button
          type="button"
          disabled={garments.length === 0}
          onClick={randomizeLook}
          className="rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aleatorio
        </button>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setError(undefined)
            setIsSaveOpen(true)
          }}
          className="rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Guardar look
        </button>
      </div>

      {isSaveOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-look-title"
          >
            <h2 id="save-look-title" className="text-lg font-semibold text-zinc-900">
              Guardar look
            </h2>
            <p className="mt-1 text-sm leading-5 text-zinc-500">
              Puedes ponerle un nombre o dejarlo vacío para generar uno automáticamente.
            </p>

            <form onSubmit={handleSave} className="mt-5">
              <label htmlFor="look-name" className="text-sm font-medium text-zinc-700">
                Nombre
              </label>
              <input
                id="look-name"
                value={lookName}
                onChange={(event) => setLookName(event.target.value)}
                placeholder="Ej. Casual para salir"
                autoFocus
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-violet-400"
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsSaveOpen(false)}
                  className="rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
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

function randomIndex(total: number) {
  if (total <= 1) {
    return 0
  }

  return Math.floor(Math.random() * total)
}
