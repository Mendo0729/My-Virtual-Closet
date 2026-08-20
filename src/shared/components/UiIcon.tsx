export type UiIconName =
  | 'arrow-left'
  | 'camera'
  | 'image'
  | 'sun'
  | 'moon'
  | 'database'
  | 'cloud'
  | 'info'
  | 'chevron-left'
  | 'chevron-right'
  | 'shuffle'
  | 'share'
  | 'more'
  | 'heart'
  | 'sparkles'
  | 'pencil'
  | 'trash'

interface UiIconProps {
  name: UiIconName
  className?: string
  strokeWidth?: number
}

export default function UiIcon({ name, className = 'h-5 w-5', strokeWidth = 1.9 }: UiIconProps) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'arrow-left':
      return <svg {...common}><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></svg>
    case 'camera':
      return <svg {...common}><path d="M4 7.5h3l1.5-2h7l1.5 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="14" r="4" /></svg>
    case 'image':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m5 18 4.2-4 3.1 2.8 2.8-2.5L19 18" /></svg>
    case 'sun':
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    case 'moon':
      return <svg {...common}><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" /></svg>
    case 'database':
      return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></svg>
    case 'cloud':
      return <svg {...common}><path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.5 8.8 4.6 4.6 0 0 0 7 18Z" /><path d="M12 11v5M9.8 13.2 12 11l2.2 2.2" /></svg>
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></svg>
    case 'chevron-left':
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
    case 'chevron-right':
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>
    case 'shuffle':
      return <svg {...common}><path d="M16 3h5v5" /><path d="m21 3-6.5 6.5a3.5 3.5 0 0 1-5 0L3 3" /><path d="M16 21h5v-5" /><path d="m21 21-6.5-6.5a3.5 3.5 0 0 0-5 0L3 21" /></svg>
    case 'share':
      return <svg {...common}><path d="M12 16V3" /><path d="m7 8 5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
    case 'more':
      return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>
    case 'heart':
      return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    case 'sparkles':
      return <svg {...common}><path d="m12 3 1.1 3.2L16 7.4l-2.9 1.2L12 12l-1.1-3.4L8 7.4l2.9-1.2L12 3Z" /><path d="m18.5 13 .7 2 1.8.8-1.8.7-.7 2-.7-2-1.8-.7 1.8-.8.7-2Z" /><path d="m5.5 14 .8 2.4 2.2.9-2.2.9-.8 2.3-.8-2.3-2.2-.9 2.2-.9.8-2.4Z" /></svg>
    case 'pencil':
      return <svg {...common}><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
    case 'trash':
      return <svg {...common}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m6 7 1 13h10l1-13" /><path d="M10 11v5M14 11v5" /></svg>
  }
}
