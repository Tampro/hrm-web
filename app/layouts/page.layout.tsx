import type { ReactNode } from 'react'

import { cn } from '~/lib/utils'

/** Standard page wrapper: vertical stack of page blocks */
export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>
}
