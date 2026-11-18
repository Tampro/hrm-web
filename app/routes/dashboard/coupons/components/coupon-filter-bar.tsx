import { Search } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { TCouponFilterSchema } from '~/helpers/schema.helper'
import { DATA } from '~/shared/constants/data.constant'
import { ECouponFilterFormKey } from '~/shared/enums/form.enum'

interface IProps {
  form: UseFormReturn<TCouponFilterSchema>
  appliedCount: number
  onSearch: () => void
  onReset: () => void
}

/** Manual 3.2.4: search, Type, Date From, Date To, Clear Filters, Filters badge */
export function CouponFilterBar({ form, appliedCount, onSearch, onReset }: IProps) {
  const { t } = useTranslation()
  const typeOptions = DATA.GET_COUPON_TYPE_OPTIONS(t, true)

  return (
    <form
      className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
      noValidate
    >
      <Controller
        name={ECouponFilterFormKey.Keyword}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='coupon-keyword'>{t('coupon.filter.keyword')}</FieldLabel>
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input
                {...field}
                id='coupon-keyword'
                placeholder={t('coupon.filter.keyword_placeholder')}
                className='h-[38px] pl-8'
              />
            </div>
          </Field>
        )}
      />
      <Controller
        name={ECouponFilterFormKey.Type}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='coupon-type'>{t('coupon.field.type')}</FieldLabel>
            <Select items={typeOptions} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <SelectTrigger id='coupon-type' className='h-[38px] w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <Controller
        name={ECouponFilterFormKey.DateFrom}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='coupon-date-from'>{t('saas.filter.date_from')}</FieldLabel>
            <DatePickerCustom id='coupon-date-from' value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />
      <Controller
        name={ECouponFilterFormKey.DateTo}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='coupon-date-to'>{t('saas.filter.date_to')}</FieldLabel>
            <DatePickerCustom
              id='coupon-date-to'
              value={field.value}
              onChange={(value) => {
                field.onChange(value)
                void form.trigger(ECouponFilterFormKey.DateTo)
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
