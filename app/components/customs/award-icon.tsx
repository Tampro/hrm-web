import {
  Award,
  Crown,
  Gem,
  Heart,
  Lightbulb,
  Medal,
  Rocket,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  Trophy,
  Users,
  type LucideIcon
} from 'lucide-react'

import { cn } from '~/lib/utils'

/**
 * Icon set of award types. Spec: AwardTypeForm.icon is "a key of the FE icon set" ([a-z0-9-], omitted = default):
 * the backend stores the key only, this map turns it into an icon. Unknown keys fall back to the default.
 */
export const AWARD_ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  medal: Medal,
  award: Award,
  star: Star,
  crown: Crown,
  gem: Gem,
  heart: Heart,
  'thumbs-up': ThumbsUp,
  rocket: Rocket,
  target: Target,
  lightbulb: Lightbulb,
  users: Users,
  sparkles: Sparkles
}

export const DEFAULT_AWARD_ICON = 'trophy'

/** Award type icon in a tinted circle */
export function AwardIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = AWARD_ICONS[icon ?? ''] ?? AWARD_ICONS[DEFAULT_AWARD_ICON]
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600',
        className
      )}
    >
      <Icon className='size-4' />
    </span>
  )
}
