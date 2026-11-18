import { Search } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import type { TSaasFilterSchema } from '~/helpers/schema.helper'
import { cn } from '~/lib/utils'
import { ESaasFilterFormKey } from '~/shared/enums/form.enum'

interface IProps {
  form: UseFormReturn<TSaasFilterSchema>
  keywordPlaceholder: string
  /** Plan Orders also filter by order date (manual 3.2.3: Date From / Date To) */
  withDates?: boolean
  appliedCount: number
  onSearch: () => void
  onReset: () => void
}

/** Filter bar of the Plan Requests / Plan Orders pages (manual 3.2.3) */
export function SaasFilterBar({ form, keywordPlaceholder, withDates, appliedCount, onSearch, onReset }: IProps) {
  const { t } = useTranslation()

  return (
    <form
      className={cn(
        'bg-card grid gap-3 rounded-xl border p-4',
        withDates
          ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'
          : 'md:grid-cols-[minmax(0,1fr)_auto]'
      )}
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
      noValidate
    >
      <Controller
        name={ESaasFilterFormKey.Keyword}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='saas-keyword'>{t('saas.filter.keyword')}</FieldLabel>
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input {...field} id='saas-keyword' placeholder={keywordPlaceholder} className='h-[38px] pl-8' />
            </div>
          </Field>
        )}
      />
      {withDates && (
        <>
          <Controller
            name={ESaasFilterFormKey.DateFrom}
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='saas-date-from'>{t('saas.filter.date_from')}</FieldLabel>
                <DatePickerCustom id='saas-date-from' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />
          <Controller
            name={ESaasFilterFormKey.DateTo}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='saas-date-to'>{t('saas.filter.date_to')}</FieldLabel>
                <DatePickerCustom
                  id='saas-date-to'
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value)
                    void form.trigger(ESaasFilterFormKey.DateTo)
                  }}
                  isInvalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </>
      )}
      <div className='flex items-end gap-2'>
        <Button type='submit' className='h-[38px]'>
          {t('common.search')}
          {appliedCount > 0 && (
            <Badge
              variant='secondary'
              className='ml-1'
              aria-label={t('company.filter.applied', { count: appliedCount })}
            >
              {appliedCount}
            </Badge>
          )}
        </Button>
        <Button type='button' variant='outline' className='h-[38px]' onClick={onReset}>
          {t('company.filter.clear')}
        </Button>
      </div>
    </form>
  )
}
