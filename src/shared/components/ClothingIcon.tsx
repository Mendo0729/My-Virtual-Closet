import { useId } from 'react'

export type ClothingIconKind = 'top' | 'bottom' | 'shoes' | 'jacket' | 'accessory'

interface ClothingIconProps {
  kind: ClothingIconKind
  className?: string
}

export default function ClothingIcon({ kind, className = 'h-7 w-7' }: ClothingIconProps) {
  const rawId = useId()
  const gradientId = `clothing-${kind}-${rawId.replace(/:/g, '')}`

  if (kind === 'top') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="16" y1="12" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.48" />
          </linearGradient>
        </defs>
        <path
          d="M22 12.5 12 18l-6 11.5 10 5.3 4-6.3V52h24V28.5l4 6.3 10-5.3L52 18l-10-5.5c-2.5 3.3-5.8 5-10 5s-7.5-1.7-10-5Z"
          fill={`url(#${gradientId})`}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M24 13.5c1.7 4 4.3 6 8 6s6.3-2 8-6" stroke="white" strokeOpacity="0.66" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 29.5V48" stroke="white" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'bottom') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="18" y1="8" x2="46" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.46" />
          </linearGradient>
        </defs>
        <path
          d="M18 9h28l-1.5 18.5L49 55H36l-4-24-4 24H15l4.5-27.5L18 9Z"
          fill={`url(#${gradientId})`}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M19 16h26M32 16v15" stroke="white" strokeOpacity="0.62" strokeWidth="2" strokeLinecap="round" />
        <path d="m21 21 7 4M43 21l-7 4" stroke="white" strokeOpacity="0.24" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'shoes') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="14" y1="20" x2="51" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.92" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.42" />
          </linearGradient>
        </defs>
        <path
          d="M13 19c5.5 7.5 11.4 12 18 13.5 5.6 1.3 9.3.3 13.8 2.8 4.1 2.3 6.8 5.1 8.2 8.5.7 1.8-.5 3.7-2.5 4.1-11.3 2-22.1 1.9-32.5-.4-5.5-1.2-8.4-4.7-8.7-10.3-.3-5.8.9-11.8 3.7-18.2Z"
          fill={`url(#${gradientId})`}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M20 26.5 28 23M24.5 30l8-3.5M30 33l7.5-3" stroke="white" strokeOpacity="0.72" strokeWidth="2" strokeLinecap="round" />
        <path d="M11.5 40.5c12.4 3.2 25.7 3.8 39.8 1.7" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'jacket') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="14" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.94" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.44" />
          </linearGradient>
        </defs>
        <path
          d="M22 11 13 17 8 31l9 4 4-8v28h22V27l4 8 9-4-5-14-9-6-4 7H26l-4-7Z"
          fill={`url(#${gradientId})`}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M26 18 32 25l6-7M32 25v30" stroke="white" strokeOpacity="0.68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 35h5M35 35h5" stroke="white" strokeOpacity="0.34" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="14" y1="15" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.94" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.42" />
        </linearGradient>
      </defs>
      <path
        d="M16 23h32l3 31H13l3-31Z"
        fill={`url(#${gradientId})`}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M23 25v-5c0-5 3.8-9 9-9s9 4 9 9v5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 27v-3M41 27v-3" stroke="white" strokeOpacity="0.64" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.5 32.5h27" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
