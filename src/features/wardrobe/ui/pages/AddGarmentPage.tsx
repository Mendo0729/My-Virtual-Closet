import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { createGarment } from '../../application/createGarment'
import type { GarmentCategory } from '../../domain/Garment'
import { processGarmentImage, removeGarmentBackground } from '../../../../infrastructure/storage/imageProcessor'
import UiIcon from '../../../../shared/components/UiIcon'
import ImagePicker from '../components/ImagePicker'

const categoryOptions: Array<{ value: GarmentCategory; label: string }> = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'shoes', label: 'Zapatos' },
  { value: 'accessory', label: 'Accesorio' },
]

const transparentPreviewStyle = {
  backgroundColor: '#f4f4f5',
  backgroundImage:
    'linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundSize: '16px 16px',
}

export default function AddGarmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<GarmentCategory>('top')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [image, setImage] = useState<Blob>()
  const [originalImage, setOriginalImage] = useState<Blob>()
  const [cutoutSource, setCutoutSource] = useState<Blob>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLabel, setProcessingLabel] = useState('Optimizando imagen…')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!image) {
      setPreviewUrl(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(image)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  async function handleImageSelected(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen válido.')
      return
    }

    setError(undefined)
    setIsProcessing(true)
    setProcessingLabel('Optimizando imagen…')
    setIsBackgroundRemoved(false)

    try {
      const processedImage = await processGarmentImage(file)
      setCutoutSource(file)
      setOriginalImage(processedImage)
      setImage(processedImage)
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'No se pudo procesar la imagen.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRemoveBackground() {
    const source = cutoutSource ?? originalImage

    if (!source) {
      return
    }

    setError(undefined)
    setIsProcessing(true)
    setProcessingLabel('Analizando prenda y fondo…')

    try {
      const transparentImage = await removeGarmentBackground(source)
      setImage(transparentImage)
      setIsBackgroundRemoved(true)
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'No se pudo quitar el fondo de la imagen.')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleRestoreOriginal() {
    if (!originalImage) {
      return
    }

    setError(undefined)
    setImage(originalImage)
    setIsBackgroundRemoved(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!image) {
      setError('Primero debes tomar o elegir una foto de la prenda.')
      return
    }

    if (!name.trim() || !color.trim()) {
      setError('Completa el nombre y el color de la prenda.')
      return
    }

    setError(undefined)
    setIsSaving(true)

    try {
      await createGarment({ name, category, color, brand, image })
      navigate('/closet')
    } catch {
      setError('No se pudo guardar la prenda en este dispositivo.')
    } finally {
      setIsSaving(false)
    }
  }

  const fieldClass =
    'mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-violet-400 dark:border-white/10 dark:bg-[#111c2e] dark:text-white dark:placeholder:text-slate-600'

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
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">Nueva prenda</p>
          <h1 className="mt-0.5 text-lg font-extrabold text-zinc-950 dark:text-white">Agregar prenda</h1>
        </div>
        <span />
      </header>

      <form onSubmit={handleSubmit} className="pb-6">
        <section className="mt-5 rounded-[26px] border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4 text-center shadow-sm dark:border-violet-500/15 dark:from-violet-500/10 dark:via-[#0d1829] dark:to-pink-500/10">
          {previewUrl ? (
            <div
              className={`relative overflow-hidden rounded-[20px] ${isBackgroundRemoved ? '' : 'bg-white dark:bg-[#111c2e]'}`}
              style={isBackgroundRemoved ? transparentPreviewStyle : undefined}
            >
              {isBackgroundRemoved && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-zinc-950/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                  Fondo transparente
                </span>
              )}
              <img src={previewUrl} alt="Vista previa de la prenda" className="aspect-square w-full object-contain" />
            </div>
          ) : (
            <div className="px-2 py-7">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-violet-600 shadow-md dark:bg-[#111c2e] dark:text-fuchsia-300">
                <UiIcon name="camera" className="h-8 w-8" strokeWidth={1.7} />
              </div>
              <h2 className="mt-4 text-base font-extrabold text-zinc-900 dark:text-white">Toma una foto</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">o selecciona una imagen de tu galería</p>
            </div>
          )}

          {isProcessing && (
            <p className="mt-4 text-sm font-bold text-violet-600 dark:text-fuchsia-300" role="status">
              {processingLabel}
            </p>
          )}

          <ImagePicker onSelect={handleImageSelected} disabled={isProcessing || isSaving} />

          {image && originalImage && (
            <div className="mt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  disabled={isProcessing || isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-xs font-extrabold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                >
                  <UiIcon name="sparkles" className="h-4 w-4" />
                  {isBackgroundRemoved ? 'Recortar de nuevo' : 'Quitar fondo'}
                </button>

                {isBackgroundRemoved && (
                  <button
                    type="button"
                    onClick={handleRestoreOriginal}
                    disabled={isProcessing || isSaving}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-extrabold text-zinc-700 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#111c2e] dark:text-slate-200"
                  >
                    Usar original
                  </button>
                )}
              </div>
              <p className="mt-2 px-2 text-[11px] leading-4 text-zinc-500 dark:text-slate-400">
                {isBackgroundRemoved
                  ? 'El recorte se guardará con transparencia. Puedes volver a la foto original antes de guardar.'
                  : 'Beta: funciona mejor cuando la prenda está completa sobre un fondo liso y con buen contraste.'}
              </p>
            </div>
          )}
        </section>

        {image && (
          <section className="mt-4 space-y-4 rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
            <Field label="Nombre">
              <input id="garment-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Camiseta blanca" className={fieldClass} />
            </Field>

            <Field label="Categoría">
              <select id="garment-category" value={category} onChange={(event) => setCategory(event.target.value as GarmentCategory)} className={fieldClass}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Color principal">
              <input id="garment-color" value={color} onChange={(event) => setColor(event.target.value)} placeholder="Ej. Blanco" className={fieldClass} />
            </Field>

            <Field label="Marca" optional>
              <input id="garment-brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Ej. Zara" className={fieldClass} />
            </Field>

            <button
              type="submit"
              disabled={isSaving || isProcessing}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pink-500/15 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : 'Guardar prenda'}
            </button>
          </section>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>
        )}

        {!image && (
          <div className="mt-4 rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-fuchsia-300">
                <UiIcon name="sparkles" className="h-4 w-4" />
              </span>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white">Tips para una mejor foto</p>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-500 dark:text-slate-400">
              <li>• Usa un fondo liso que contraste con la prenda.</li>
              <li>• Procura tener buena iluminación.</li>
              <li>• Asegúrate de que toda la prenda sea visible.</li>
            </ul>
          </div>
        )}
      </form>
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
