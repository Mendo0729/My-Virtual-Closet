import { NavLink } from 'react-router'

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors',
    isActive
      ? 'text-violet-600 dark:text-fuchsia-400'
      : 'text-zinc-500 dark:text-slate-400',
  ].join(' ')

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 border-t border-black/[0.06] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(50,35,80,0.05)] backdrop-blur-xl transition-colors dark:border-white/[0.08] dark:bg-[#0a1322]/95 dark:shadow-[0_-12px_30px_rgba(0,0,0,0.24)]">
      <NavLink to="/" end className={navItemClass}>
        <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
        </svg>
        <span>Inicio</span>
      </NavLink>

      <NavLink to="/closet" className={navItemClass}>
        <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" />
          <path d="M12 4v16M8.5 11h.01M15.5 11h.01" />
        </svg>
        <span>Closet</span>
      </NavLink>

      <NavLink
        to="/outfit"
        className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-zinc-500 dark:text-slate-400"
      >
        <span className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-violet-600 to-pink-500 text-[28px] font-light text-white shadow-[0_10px_24px_rgba(236,72,153,0.32)] transition-transform active:scale-95 dark:border-[#0a1322]">
          +
        </span>
        <span>Crear</span>
      </NavLink>

      <NavLink to="/outfits" className={navItemClass}>
        <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z" />
        </svg>
        <span>Looks</span>
      </NavLink>

      <NavLink to="/settings" className={navItemClass}>
        <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 13.5v-3l-2-.7a6.6 6.6 0 0 0-.6-1.5l.9-1.9-2.1-2.1-1.9.9a6.6 6.6 0 0 0-1.5-.6L11.1 2h-3l-.7 2.1a6.6 6.6 0 0 0-1.5.6L4 3.8 1.9 5.9l.9 1.9a6.6 6.6 0 0 0-.6 1.5L0 10v3l2.2.7c.1.5.3 1 .6 1.5l-.9 1.9L4 19.2l1.9-.9c.5.3 1 .5 1.5.6L8.1 21h3l.7-2.1c.5-.1 1-.3 1.5-.6l1.9.9 2.1-2.1-.9-1.9c.3-.5.5-1 .6-1.5L19 13.5Z" transform="translate(2.5 .5) scale(.8)" />
        </svg>
        <span>Ajustes</span>
      </NavLink>
    </nav>
  )
}
