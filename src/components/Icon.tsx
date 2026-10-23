type IconName = 'instagram' | 'chevron-left' | 'chevron-right' | 'chevron-up' | 'chevron-down' | 'grip'

const chevron = {
  left: 'M15 18 9 12l6-6',
  right: 'M9 18l6-6-6-6',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
} as const

export function Icon({ name }: { name: IconName }) {
  if (name === 'instagram') {
    return (
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (name === 'grip') {
    return (
      <svg className="icon icon--grip" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    )
  }

  const direction = name.slice('chevron-'.length) as keyof typeof chevron
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={chevron[direction]} />
    </svg>
  )
}
