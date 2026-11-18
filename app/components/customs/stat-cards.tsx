import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'
import type { IInfoRow } from '~/shared/models/common.model'

interface IProps {
  /** label / value per card (from DATA.GET_*_CARDS) */
  items: IInfoRow[]
  /** accessible name of the group, e.g. "Coupon summary" */
  label: string
  loading?: boolean
  className?: string
}

/** Row of summary cards (metric label + big value) */
export function StatCards({ items, label, loading, className }: IProps) {
  return (
    <section aria-label={label} className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.label} className='bg-card flex flex-col gap-1 rounded-xl border p-4'>
          <span className='text-muted-foreground text-sm'>{item.label}</span>
          {loading ? <Skeleton className='h-7 w-24' /> : <span className='text-xl font-semibold'>{item.value}</span>}
        </div>
      ))}
    </section>
  )
}
