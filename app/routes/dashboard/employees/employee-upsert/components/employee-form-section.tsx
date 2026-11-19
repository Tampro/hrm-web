import type { ReactNode } from 'react'

/** Titled block of the wizard (design: upper-case grey title, fields in a 3-column grid) */
export function EmployeeFormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5'>
      <h2 className='text-muted-foreground text-sm font-semibold uppercase'>{title}</h2>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
    </section>
  )
}
