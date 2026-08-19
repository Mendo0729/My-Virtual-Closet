import BrandMark from '../../../shared/components/BrandMark'
import { useTheme } from '../../../shared/theme/ThemeProvider'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="px-4 pt-5">
      <header>
        <p className="text-xs font-semibold text-zinc-400 dark:text-slate-500">Personaliza tu experiencia</p>
        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Ajustes</h1>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-[24px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 p-5 text-white shadow-[0_18px_40px_rgba(219,39,119,0.2)]">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-extrabold">Tu estilo, tu historia 💜</p>
            <p className="mt-1 text-xs text-white/80">Haz que My Virtual Closet se sienta tuyo.</p>
          </div>
          <div className="rounded-2xl bg-white/14 p-2 backdrop-blur">
            <BrandMark compact />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-400 dark:text-slate-500">App</h2>
        <div className="mt-2 overflow-hidden rounded-[22px] border border-black/[0.05] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between gap-4 border-b border-zinc-100 px-4 py-4 text-left dark:border-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-lg dark:bg-violet-500/10">{isDark ? '🌙' : '☀️'}</span>
              <div>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-white">Tema</p>
                <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-slate-500">{isDark ? 'Oscuro' : 'Claro'}</p>
              </div>
            </div>

            <span className={[
              'relative h-7 w-12 rounded-full transition-colors',
              isDark ? 'bg-gradient-to-r from-violet-600 to-pink-500' : 'bg-zinc-200',
            ].join(' ')}>
              <span className={[
                'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                isDark ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')} />
            </span>
          </button>

          <SettingsRow icon="💾" title="Almacenamiento local" subtitle="Prendas, imágenes y looks en este dispositivo" />
          <SettingsRow icon="☁️" title="Copia de seguridad" subtitle="Disponible en una próxima versión" />
          <SettingsRow icon="ⓘ" title="Acerca de la app" subtitle="My Virtual Closet · Versión 0.1.0" last />
        </div>
      </section>

      <section className="mt-6 pb-4">
        <h2 className="px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-400 dark:text-slate-500">Datos</h2>
        <div className="mt-2 rounded-[22px] border border-black/[0.05] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#0d1829]">
          <p className="text-xs font-bold text-zinc-700 dark:text-slate-200">Privacidad local</p>
          <p className="mt-1.5 text-[11px] leading-5 text-zinc-500 dark:text-slate-400">
            Tus fotos, prendas y looks permanecen guardados localmente en este dispositivo.
          </p>
        </div>
      </section>
    </div>
  )
}

function SettingsRow({
  icon,
  title,
  subtitle,
  last = false,
}: {
  icon: string
  title: string
  subtitle: string
  last?: boolean
}) {
  return (
    <div className={['flex items-center gap-3 px-4 py-4', last ? '' : 'border-b border-zinc-100 dark:border-white/[0.06]'].join(' ')}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-base dark:bg-white/[0.04]">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-zinc-900 dark:text-white">{title}</p>
        <p className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}
