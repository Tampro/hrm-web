import type { IInfoRow } from '~/shared/models/common.model'

/** Label / value rows of an info card or panel (rows come from DATA.GET_*_ROWS) */
export function InfoRows({ rows }: { rows: IInfoRow[] }) {
  return (
    <dl className='grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2.5 text-sm'>
      {rows.map((row) => (
        <div key={row.label} className='contents'>
          <dt className='text-muted-foreground'>{row.label}</dt>
          <dd className='font-medium break-words'>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
