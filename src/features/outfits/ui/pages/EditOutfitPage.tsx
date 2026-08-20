import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import ClothingIcon from '../../../../shared/components/ClothingIcon'
import UiIcon from '../../../../shared/components/UiIcon'
import type { Garment } from '../../../wardrobe/domain/Garment'
import { updateOutfit } from '../../application/updateOutfit'
import type { OutfitCategory, OutfitSlot } from '../../domain/Outfit'
import GarmentImage from '../components/GarmentImage'

const slotDefinitions: Array<{ slot: OutfitSlot; label: string }> = [
  { slot: 'top', label: 'Top' },
  { slot: 'bottom', label: 'Bottom' },
  { slot: 'shoes', label: 'Calzado' },
  { slot: 'accessory', label: 'Accesorio' },
]

const categoryOptions: Array<{ value: OutfitCategory; label: string }> = [
  { value: 'casual', label: 'Casual' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'noche', label: 'Noche' },
  { value: 'deporte', label: 'Deporte' },
]

const emptySelection: Record<OutfitSlot, string> = {
  top: '',
  bottom: '',
  shoes: '',
  accessory: '',
}

export default function EditOutfitPage() {
  const navigate = useNavigate()
  const { outfitId } = useParams<{ outfitId: string }>()
  const data = useLiveQuery(async () => {
    if (!outfitId) return null

    const outfit = await db.outfits.get(outfitId)
    if (!outfit) return null

    const [items, garments] = await Promise.all([
      db.outfitItems.where('outfitId').equals(outfitId).toArray(),
      db.garments.toArray(),
    ])

    return { outfit, items, garments }
  }, [outfitId])

  const [name, setName] = useState('')
  const [category, setCategory] = useState<OutfitCategory>('casual')
  const [selectedIds, setSelectedIds] = useState<Record<OutfitSlot, string>>(emptySelection)
  const [initializedId, setInitializedId] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!data || data.outfit.id === initializedId) return

    const nextSelection: Record<OutfitSlot, string> = { ...emptySelection }
    data.items.forEach((item) => {
      nextSelection[item.slot] = item.garmentId
    })

    setName(data.outfit.name)
    setCategory(data.outfit.category ?? 'casual')
    setSelectedIds(nextSelection)
    setInitializedId(data.outfit.id)
  }, [data, initializedId])

  const garmentsBySlot = useMemo<Record<OutfitSlot, Garment[]>>(() => {
    const garments = data?.garments ?? []
    return {
      top: garments.filter((garment) => garment.category === 'top'),
      bottom: garments.filter((garment) => garment.category === 'bottom'),
      shoes: garments.filter((garment) => garment.category === 'shoes'),
      accessory: garments.filter((garment) => garment.category === 'accessory'),
    }
  }, [data?.garments])

  const selectedItems = slotDefinitions.flatMap(({ slot }) => {
    const garmentId = selectedIds[slot]
    return garmentId ? [{ garmentId, slot }] : []
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!data?.outfit) return
    if (!name.trim()) {
      setError('Escribe un nombre para el look.')
      return
    }
    if (selectedItems.length < 2) {
      setError('Selecciona al menos dos prendas para guardar el look.')
      return
    }

    setError(undefined)
    setIsSaving(true)

    try {
      await updateOutfit({
        id: data.outfit.id,
        name,
        category,
        items: selectedItems.map((item, position) => ({ ...item, position })),
      })
      navigate('/outfits')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el look.')
      setIsSaving(false)
    }
  }

  if (data === undefined) {
    return <div className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-slate-400">Cargando look…</div>
  }

  if (data === null) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm font-bold text-zinc-800 dark:text-white">Este look ya no existe.</p>
        <Link to="/outfits" className="mt-4 inline-flex text-sm font-bold text-violet-600 dark:text-fuchsia-400">Volver a looks</Link>
      </div>
    )
  }

  const fieldClass =
    'mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-[#111c2e] dark:text-white'

  return (
    <div className="px-4 pt-5">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Link
          to="/outfits"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm ring-1 ring-black/[0.04] dark:bg-[#0d1829] dark:text-white dark:ring-white/[0.06]"
          aria-label="Volver a looks"
        >
          <UiIcon name="arrow-left" className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">Look guardado</p>
          <h1 className="mt-0.5 text-lg font-extrabold text-zinc-950 dark:text-white">Editar look</h1>
        </div>
        <span />
      </header>

      <form onSubmit={handleSubmit} className="pb-6">
        <section className="mt-5 space-y-4 rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
          <div>
            <label htmlFor="outfit-name" className="text-xs font-bold text-zinc-700 dark:text-slate-300">Nombre</label>
            <input
              id="outfit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Casual para oficina"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="outfit-category" className="text-xs font-bold text-zinc-700 dark:text-slate-300">Categoría</label>
            <select
              id="outfit-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as OutfitCategory)}
              className={fieldClass}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white">Prendas del look</h2>
              <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-slate-500">Selecciona al menos dos categorías.</p>
            </div>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              {selectedItems.length}/4
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {slotDefinitions.map(({ slot, label }) => {
              const options = garmentsBySlot[slot]
              const selected = options.find((garment) => garment.id === selectedIds[slot])

              return (
                <div key={slot} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-2.5 dark:bg-[#111c2e]">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-violet-500 dark:bg-white/[0.04] dark:text-violet-300">
                    {selected ? (
                      <GarmentImage imageId={selected.imageId} alt={selected.name} className="h-full w-full object-contain" />
                    ) : (
                      <ClothingIcon kind={slot} className="h-8 w-8 opacity-55" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <label htmlFor={`outfit-${slot}`} className="text-[10px] font-extrabold text-zinc-500 dark:text-slate-400">{label}</label>
                    <select
                      id={`outfit-${slot}`}
                      value={selectedIds[slot]}
                      onChange={(event) => setSelectedIds((current) => ({ ...current, [slot]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#0d1829] dark:text-white"
                    >
                      <option value="">Sin prenda</option>
                      {options.map((garment) => (
                        <option key={garment.id} value={garment.id}>{garment.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pink-500/15 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
