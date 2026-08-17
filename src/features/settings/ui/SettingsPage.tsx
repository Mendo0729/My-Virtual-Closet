export default function SettingsPage() {
  return (
    <div className="px-4 pt-7">
      <p className="text-sm text-zinc-500">
        Preferencias
      </p>

      <h1 className="text-2xl font-semibold tracking-tight">
        Ajustes
      </h1>

      <div className="mt-6 space-y-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">
            Almacenamiento local
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Tus prendas, imágenes y outfits se almacenarán en este dispositivo.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">
            My Virtual Closet
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Versión 0.1.0
          </p>
        </div>
      </div>
    </div>
  )
}
