interface BrandMarkProps {
  compact?: boolean
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-500/20">
        <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
          <path
            d="M24 12.5c0-3.3 2.2-5.5 5.2-5.5 2.6 0 4.8 1.8 4.8 4.5 0 3.3-2.8 4.8-5.7 6.5L41 28.5c1.4 1.1.7 3.5-1.1 3.5H8.1c-1.8 0-2.5-2.4-1.1-3.5L21.8 17"
            stroke="currentColor"
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 35.4s-6-3.5-6-7.8c0-2.3 1.8-4 4-4 1.2 0 2.1.5 2.9 1.4.8-.9 1.8-1.4 3-1.4 2.2 0 4 1.7 4 4 0 4.3-7.9 7.8-7.9 7.8Z"
            fill="currentColor"
            opacity=".95"
          />
        </svg>
        <span className="absolute -right-1 -top-1 text-[11px]">✦</span>
      </span>

      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-tight text-zinc-950 dark:text-white">
            My Virtual
          </span>
          <span className="mt-0.5 block bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-sm font-extrabold text-transparent">
            Closet
          </span>
        </span>
      )}
    </div>
  )
}
