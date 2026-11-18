import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { dateHelper } from '~/helpers/date.helper'
import { cn } from '~/lib/utils'

interface IProps {
  /** YYYY-MM-DD or '' */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  isInvalid?: boolean
  className?: string
}

/** Single-day picker storing the backend day format (YYYY-MM-DD) */
export function DatePickerCustom({ value, onChange, placeholder, id, isInvalid, className }: IProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = dateHelper.parseApiDate(value)

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type='button'
              variant='outline'
              aria-invalid={isInvalid}
              className={cn('h-[38px] w-full justify-start pr-8 font-normal', !selected && 'text-muted-foreground')}
            />
          }
        >
          <CalendarIcon />
          {selected ? dateHelper.formatDate(value) : (placeholder ?? t('common.select_date'))}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(dateHelper.toApiDate(date) ?? '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          type='button'
          variant='ghost'
          size='icon-xs'
          className='absolute top-1/2 right-1.5 -translate-y-1/2'
          onClick={() => onChange('')}
          aria-label={t('common.clear')}
        >
          <X />
        </Button>
      )}
    </div>
  )
}
