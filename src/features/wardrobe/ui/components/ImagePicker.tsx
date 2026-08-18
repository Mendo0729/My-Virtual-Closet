import { useRef, type ChangeEvent } from 'react'

interface ImagePickerProps {
  onSelect: (file: File) => void
  disabled?: boolean
}

export default function ImagePicker({ onSelect, disabled = false }: ImagePickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      onSelect(file)
    }

    event.target.value = ''
  }

  return (
    <>
      <input
        ref={cameraInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />

      <input
        ref={galleryInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={handleChange}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => cameraInputRef.current?.click()}
        className="mt-7 w-full rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Usar cámara
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => galleryInputRef.current?.click()}
        className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Elegir de la galería
      </button>
    </>
  )
}
