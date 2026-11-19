import { Check } from 'lucide-react'

import { cn } from '~/lib/utils'
import type { ITabOption } from '~/shared/models/common.model'

interface IProps<T extends string> {
  steps: ITabOption<T>[]
  current: T
  /** steps already passed can be reopened */
  onSelect: (step: T) => void
}

/** Numbered steps of the wizard (design CmsThemNhanVien: circle, title, line between steps) */
export function EmployeeStepper<T extends string>({ steps, current, onSelect }: IProps<T>) {
  const currentIndex = steps.findIndex((s) => s.value === current)

  return (
    <ol className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      {steps.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <li key={step.value} className='flex min-w-0 flex-1 items-center gap-3'>
            <button
              type='button'
              disabled={!isDone}
              onClick={() => onSelect(step.value)}
              aria-current={isCurrent ? 'step' : undefined}
              className='flex min-w-0 items-center gap-2 text-left disabled:cursor-default'
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                  isCurrent && 'bg-primary border-primary text-primary-foreground',
                  isDone && 'border-primary text-primary',
                  !isCurrent && !isDone && 'text-muted-foreground'
                )}
              >
                {isDone ? <Check className='size-4' /> : index + 1}
              </span>
              <span className={cn('truncate text-sm font-medium', !isCurrent && 'text-muted-foreground')}>
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && <span aria-hidden className='bg-border hidden h-px flex-1 sm:block' />}
          </li>
        )
      })}
    </ol>
  )
}
