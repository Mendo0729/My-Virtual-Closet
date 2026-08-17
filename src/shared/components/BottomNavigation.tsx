import { NavLink } from 'react-router'

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition',
    isActive ? 'text-violet-700' : 'text-zinc-500',
  ].join(' ')

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 border-t border-zinc-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur">
      <NavLink to="/" end className={navItemClass}>
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
        </svg>
        <span>Inicio</span>
      </NavLink>

      <NavLink to="/closet" className={navItemClass}>
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M12 3v18" />
          <path d="M9.5 12h.01M14.5 12h.01" />
        </svg>
        <span>Closet</span>
      </NavLink>

      <NavLink
        to="/outfit"
        className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-zinc-600"
      >
        <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#fcfbfd] bg-violet-600 text-3xl font-light text-white shadow-lg shadow-violet-200">
          +
        </span>
        <span>Outfit</span>
      </NavLink>

      <NavLink to="/outfits" className={navItemClass}>
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        <span>Looks</span>
      </NavLink>

      <NavLink to="/settings" className={navItemClass}>
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.9 13.6H3v-4h-.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 10.4 2.9V3h4v-.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.3.7.6 1 .3.3.7.4 1.1.4H21v4h-.1a1.7 1.7 0 0 0-1.5.6Z" />
        </svg>
        <span>Ajustes</span>
      </NavLink>
    </nav>
  )
}
