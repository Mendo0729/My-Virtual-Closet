import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router'
import { db } from '../../../../infrastructure/database/db'
import { processGarmentImage } from '../../../../infrastructure/storage/imageProcessor'
import UiIcon from '../../../../shared/components/UiIcon'
import { deleteGarment } from '../../application/deleteGarment'
import { updateGarment } from '../../application/updateGarment'
import type { GarmentCategory } from '../../domain/Garment'
import ImagePicker from '../components/ImagePicker'

const categoryOptions: Array<{ value: GarmentCategory; label: string }> = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'shoes', label: 'Zapatos' },
  { value: 'accessory', label: 'Accesorio' },
]

export default function EditGarmentPage() {
  const navigate = useNavigate()
  const { garmentId } = useParams<{ garmentId: string }>()
  const garment = useLiveQuery(
    async () => (garmentId ? (await db.garments.get(garmentId)) ?? null : null),
    [garmentId],
  )
  const currentImage = useLiveQuery(
    async () => (garment?.imageId ? (await db.garmentImages.get(garment.imageId)) ?? null : null),
    [garment?.imageId],
  )
  const affectedLookCount = useLiveQuery(async () => {
    if (!garmentId) return 0
    const items = await db.outfitItems.where('garmentId').equals(garmentId).toArray()
    return new Set(items.map((item) => item.outfitId)).size
  }, [garmentId], 0)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<GarmentCategory>('top')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [replacementImage, setReplacementImage] = useState<Blob>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!garment) return
    setName(garment.name)
    setCategory(garment.category)
    setColor(garment.color)
    setBrand(garment.brand ?? '')
  }, [garment])

  const previewBlob = replacementImage ?? currentImage?.blob

  useEffect(() => {
    if (!previewBlob) {
      setPreviewUrl(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(previewBlob)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [previewBlob])

  async function handleImageSelected(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen válido.')
      return
    }

    setError(undefined)
    setIsProcessing(true)

    try {
      setReplacementImage(await processGarmentImage(file))
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'No se pudo procesar la imagen.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!garment || !garmentId) return
    if (!name.trim() || !color.trim()) {
      setError('Completa el nombre y el color de la prenda.')
      return
    }

    setError(undefined)
    setIsSaving(true)

    try {
      await updateGarment({
        id: garmentId,
        name,
        category,
        color,
        brand,
        image: replacementImage,
      })
      navigate('/closet')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la prenda.')
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!garmentId) return

    setError(undefined)
    setIsDeleting(true)

    try {
      await deleteGarment(garmentId)
      navigate('/closet', { replace: true })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la prenda.')
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  const fieldClass =
    'mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-violet-400 dark:border-white/10 dark:bg-[#111c2e] dark:text-white dark:placeholder:text-slate-600'

  if (garment === undefined) {
    return <div className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-slate-400">Cargando prenda…</div>
  }

  if (garment === null) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm font-bold text-zinc-800 dark:text-white">Esta prenda ya no existe.</p>
        <Link to="/closet" className="mt-4 inline-flex text-sm font-bold text-violet-600 dark:text-fuchsia-400">Volver al closet</Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Link
          to="/closet"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm ring-1 ring-black/[0.04] dark:bg-[#0d1829] dark:text-white dark:ring-white/[0.06]"
          aria-label="Volver al closet"
        >
          <UiIcon name="arrow-left" className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">Administrar</p>
          <h1 className="mt-0.5 text-lg font-extrabold text-zinc-950 dark:text-white">Editar prenda</h1>
        </div>
        <span />
      </header>

      <form onSubmit={handleSubmit} className="pb-8">
        <section className="mt-5 rounded-[26px] border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4 text-center shadow-sm dark:border-violet-500/15 dark:from-violet-500/10 dark:via-[#0d1829] dark:to-pink-500/10">
          {previewUrl ? (
            <div className="overflow-hidden rounded-[20px] bg-white dark:bg-[#111c2e]">
              <img src={previewUrl} alt={garment.name} className="aspect-square w-full object-contain" />
            </div>
          ) : (
            <div className="px-2 py-7 text-zinc-400 dark:text-slate-500">No se pudo cargar la imagen actual.</div>
          )}

          <p className="mt-4 text-xs font-bold text-zinc-600 dark:text-slate-300">Cambiar foto</p>
          {isProcessing && <p className="mt-2 text-xs font-bold text-violet-600 dark:text-fuchsia-300">Optimizando imagen…</p>}
          <ImagePicker onSelect={handleImageSelected} disabled={isProcessing || isSaving || isDeleting} />
        </section>

        <section className="mt-4 space-y-4 rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
          <Field label="Nombre">
            <input id="garment-name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Categoría">
            <select id="garment-category" value={category} onChange={(event) => setCategory(event.target.value as GarmentCategory)} className={fieldClass}>
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field label="Color principal">
            <input id="garment-color" value={color} onChange={(event) => setColor(event.target.value)} className={fieldClass} />
          </Field>

          <Field label="Marca" optional>
            <input id="garment-brand" value={brand} onChange={(event) => setBrand(event.target.value)} className={fieldClass} />
          </Field>

          <button
            type="submit"
            disabled={isSaving || isProcessing || isDeleting}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pink-500/15 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </section>

        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>}

        <section className="mt-5 rounded-[24px] border border-red-200 bg-red-50/70 p-5 dark:border-red-500/20 dark:bg-red-500/[0.07]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <UiIcon name="trash" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-red-800 dark:text-red-200">Eliminar prenda</h2>
              <p className="mt-1 text-xs leading-5 text-red-700/75 dark:text-red-300/70">Esta acción elimina la prenda y su foto de este dispositivo.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isSaving || isDeleting}
            className="mt-4 w-full rounded-2xl border border-red-200 bg-white py-3 text-sm font-extrabold text-red-600 transition active:scale-[0.99] disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/[0.06] dark:text-red-300"
          >
            Eliminar prenda
          </button>
        </section>
      </form>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl dark:bg-[#0d1829]" role="dialog" aria-modal="true" aria-labelledby="delete-garment-title">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <UiIcon name="trash" className="h-5 w-5" />
            </div>
            <h2 id="delete-garment-title" className="mt-4 text-lg font-extrabold text-zinc-900 dark:text-white">¿Eliminar {garment.name}?</h2>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-slate-400">
              Se eliminarán la prenda y su imagen. {affectedLookCount > 0
                ? `También se quitará de ${affectedLookCount} ${affectedLookCount === 1 ? 'look guardado' : 'looks guardados'}; los looks conservarán las demás prendas.`
                : 'No hay looks guardados que dependan de esta prenda.'}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)} className="rounded-2xl border border-zinc-200 py-3 text-sm font-bold text-zinc-700 dark:border-white/10 dark:text-slate-300">Cancelar</button>
              <button type="button" disabled={isDeleting} onClick={handleDelete} className="rounded-2xl bg-red-600 py-3 text-sm font-extrabold text-white disabled:opacity-50">{isDeleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ children, label, optional = false }: { children: ReactNode; label: string; optional?: boolean }) {
  const htmlFor = label === 'Nombre' ? 'garment-name' : label === 'Categoría' ? 'garment-category' : label === 'Color principal' ? 'garment-color' : 'garment-brand'
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-bold text-zinc-700 dark:text-slate-300">
        {label} {optional && <span className="font-medium text-zinc-400 dark:text-slate-500">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}
