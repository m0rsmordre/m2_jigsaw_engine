type Props = { className?: string; title?: string }

/** Türkiye bayrağı — resmi oranlar (2:3, hilal + beş köşeli yıldız). */
export function FlagTr({ className = 'h-4 w-6', title = 'Türkçe' }: Props) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <rect width="30" height="20" fill="#E30A17" />
      {/* Hilal: dış beyaz daire + iç kırmızı daire */}
      <circle cx="10" cy="10" r="5" fill="#fff" />
      <circle cx="12.25" cy="10" r="4" fill="#E30A17" />
      {/* Beş köşeli yıldız */}
      <polygon
        fill="#fff"
        transform="translate(16.833,10) scale(0.22222)"
        points="0,-15 4.635,-6.345 14.265,-6.345 6.315,-0.945 9.405,7.845 0,2.745 -9.405,7.845 -6.315,-0.945 -14.265,-6.345 -4.635,-6.345"
      />
    </svg>
  )
}

/** Birleşik Krallık bayrağı (EN) */
export function FlagEn({ className = 'h-4 w-6', title = 'English' }: Props) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

/** Almanya bayrağı (DE) — siyah / kırmızı / altın */
export function FlagDe({ className = 'h-4 w-6', title = 'Deutsch' }: Props) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <rect width="30" height="20" fill="#FFCC00" />
      <rect width="30" height="13.333" fill="#DD0000" />
      <rect width="30" height="6.667" fill="#000" />
    </svg>
  )
}
