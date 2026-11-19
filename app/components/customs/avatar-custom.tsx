import { useState } from 'react'

import { cn } from '~/lib/utils'

interface IProps {
  name?: string | null
  /** image URL (may be a time-limited link that expires: falls back to the initials) */
  src?: string | null
  size?: 'sm' | 'lg'
  className?: string
}

/** Initials of the last two words: "Nguyễn Minh Thư" → "MT" (design avatars) */
const initialsOf = (name?: string | null) =>
  (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

/** Round avatar: photo when it loads, otherwise initials on the primary tint */
export function Avatar({ name, src, size = 'sm', className }: IProps) {
  const [failed, setFailed] = useState(false)
  const box = size === 'lg' ? 'size-14 text-lg' : 'size-9 text-xs'

  return src && !failed ? (
    <img
      src={src}
      alt=''
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-full object-cover', box, className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        'bg-primary/10 text-primary inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        box,
        className
      )}
    >
      {initialsOf(name)}
    </span>
  )
}
