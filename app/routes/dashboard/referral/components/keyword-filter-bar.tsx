import { Search } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import type { TKeywordFilterSchema } from '~/helpers/schema.helper'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'

interface IProps {
  form: UseFormReturn<TKeywordFilterSchema>
  placeholder: string
  onSearch: () => void
  onReset: () => void
}

/** Keyword-only filter of the Referred users / Payout requests pages (company name or email) */
export function KeywordFilterBar({ form, placeholder, onSearch, onReset }: IProps) {
  const { t } = useTranslation()

  return (
    <form
      className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_auto]'
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
      noValidate
    >
      <Controller
        name={EKeywordFilterFormKey.Keyword}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='referral-keyword'>{t('saas.filter.keyword')}</FieldLabel>
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input {...field} id='referral-keyword' placeholder={placeholder} className='h-[38px] pl-8' />
            </div>
          </Field>
        )}
      />
      <div className='flex items-end gap-2'>
        <Button type='submit' className='h-[38px]'>
          {t('common.search')}
        </Button>
        <Button type='button' variant='outline' className='h-[38px]' onClick={onReset}>
          {t('company.filter.clear')}
        </Button>
      </div>
    </form>
  )
}
