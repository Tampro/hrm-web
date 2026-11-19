import { useTranslation } from 'react-i18next'

import { cn } from '~/lib/utils'

/** Spec: ChartNode.active — green = ACTIVE or PROBATION, red = INACTIVE */
export function StatusDot({ active, className }: { active?: boolean; className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      role='img'
      aria-label={t(active ? 'employee.org_chart.active' : 'employee.org_chart.inactive')}
      className={cn('size-2.5 shrink-0 rounded-full', active ? 'bg-emerald-500' : 'bg-red-500', className)}
    />
  )
}
