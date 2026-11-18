import { Search } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import type { TCompanyFilterSchema } from '~/helpers/schema.helper'
import { ECompanyFilterFormKey } from '~/shared/enums/form.enum'

interface IProps {
  form: UseFormReturn<TCompanyFilterSchema>
  /** Filters currently applied (manual 3.2.1: the Filters badge shows the count) */
  appliedCount: number
  onSearch: () => void
  onReset: () => void
}

export function CompanyFilterBar({ form, appliedCount, onSearch, onReset }: IProps) {
  const { t } = useTranslation()

  return (
    <form
      className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
      noValidate
    >
      <Controller
        name={ECompanyFilterFormKey.Keyword}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='company-keyword'>{t('company.filter.keyword')}</FieldLabel>
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input
                {...field}
                id='company-keyword'
                placeholder={t('company.filter.keyword_placeholder')}
                className='h-[38px] pl-8'
              />
            </div>
          </Field>
        )}
      />
      <Controller
        name={ECompanyFilterFormKey.CreatedFrom}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='company-created-from'>{t('company.filter.created_from')}</FieldLabel>
            <DatePickerCustom id='company-created-from' value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />
      <Controller
        name={ECompanyFilterFormKey.CreatedTo}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='company-created-to'>{t('company.filter.created_to')}</FieldLabel>
            <DatePickerCustom
              id='company-created-to'
              value={field.value}
              onChange={(value) => {
                field.onChange(value)
                void form.trigger(ECompanyFilterFormKey.CreatedTo)
              }}
              isInvalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
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
