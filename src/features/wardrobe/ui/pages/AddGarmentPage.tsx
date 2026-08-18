import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { createGarment } from '../../application/createGarment'
import type { GarmentCategory } from '../../domain/Garment'
import { processGarmentImage } from '../../../../infrastructure/storage/imageProcessor'
import ImagePicker from '../components/ImagePicker'

const categoryOptions: Array<{ value: GarmentCategory; label: string }> = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'shoes', label: 'Zapatos' },
  { value: 'accessory', label: 'Accesorio' },
]

export default function AddGarmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<GarmentCategory>('top')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [image, setImage] = useState<Blob>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [isProcessing, setIsProcessing] = useState(false)
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

    try {
      const processedImage = await processGarmentImage(file)
      setImage(processedImage)
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'No se pudo procesar la imagen.')
    } finally {
      setIsProcessing(false)
    }
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
      await createGarment({
        name,
        category,
        color,
        brand,
        image,
      })

      navigate('/closet')
    } catch {
      setError('No se pudo guardar la prenda en este dispositivo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/closet"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          aria-label="Volver al closet"
        >
          ←
        </Link>

        <div>
          <p className="text-xs text-zinc-500">Nueva prenda</p>
          <h1 className="text-xl font-semibold">Agregar prenda</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pb-6">
        <section className="mt-7 rounded-[28px] border-2 border-dashed border-violet-200 bg-violet-50/50 p-4 text-center">
          {previewUrl ? (
            <div className="overflow-hidden rounded-2xl bg-white">
              <img
                src={previewUrl}
                alt="Vista previa de la prenda"
                className="aspect-square w-full object-contain"
              />
            </div>
          ) : (
            <div className="px-2 py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                📷
              </div>

              <h2 className="mt-4 text-lg font-semibold">Toma una foto</h2>
              <p className="mt-1 text-sm text-zinc-500">o selecciona una imagen de tu galería</p>
            </div>
          )}

          {isProcessing && (
            <p className="mt-4 text-sm font-medium text-violet-700">Optimizando imagen…</p>
          )}

          <ImagePicker onSelect={handleImageSelected} disabled={isProcessing || isSaving} />
        </section>

        {image && (
          <section className="mt-5 space-y-4 rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <label htmlFor="garment-name" className="text-sm font-medium text-zinc-700">
                Nombre
              </label>
              <input
                id="garment-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Camiseta blanca"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-violet-400"
              />
            </div>

            <div>
              <label htmlFor="garment-category" className="text-sm font-medium text-zinc-700">
                Categoría
              </label>
              <select
                id="garment-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as GarmentCategory)}
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-violet-400"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="garment-color" className="text-sm font-medium text-zinc-700">
                Color principal
              </label>
              <input
                id="garment-color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="Ej. Blanco"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-violet-400"
              />
            </div>

            <div>
              <label htmlFor="garment-brand" className="text-sm font-medium text-zinc-700">
                Marca <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <input
                id="garment-brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Ej. Zara"
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-violet-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : 'Guardar prenda'}
            </button>
          </section>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!image && (
          <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Consejos para una mejor foto</p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>• Usa un fondo limpio.</li>
              <li>• Procura tener buena iluminación.</li>
              <li>• Asegúrate de que toda la prenda sea visible.</li>
            </ul>
          </div>
        )}
      </form>
    </div>
  )
}
