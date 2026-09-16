type Props = { className?: string; title?: string }

/** Türkiye bayrağı */
export function FlagTr({ className = 'h-4 w-6', title = 'Türkçe' }: Props) {
  return (
    <svg
      viewBox="0 0 1200 800"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="1200" height="800" fill="#E30A17" />
      <circle cx="425" cy="400" r="200" fill="#fff" />
      <circle cx="475" cy="400" r="160" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="583,400 679,431 647,337 707,279 611,291 583,200 555,291 459,279 519,337 487,431"
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
    >
      <title>{title}</title>
      <clipPath id="en-flag-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#en-flag-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}
