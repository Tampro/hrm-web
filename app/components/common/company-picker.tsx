import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Field, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useGetListCompanyApi } from '~/hooks/apis/use-company-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useQueryParams } from '~/hooks/use-query-params'

/**
 * Super admin only: the company the employee pages act on (Spec: EMP_019 "Choose the company to act on").
 * Kept in the URL as ?companyId=; changing it drops the page's other filters (they belong to the old company).
 */
export function CompanyPicker() {
  const { t } = useTranslation()
  const { isSuperAdmin, companyId } = useCompanyScope()
  const { setQuery } = useQueryParams()
  // super admin lists every company; 100 covers the platform for now
  const { dataList, isLoading } = useGetListCompanyApi({ params: { page: 0, size: 100 }, enabled: isSuperAdmin })

  if (!isSuperAdmin) return null

  const items = dataList.map((c) => ({ label: `${c.name ?? '-'} (${c.code ?? '-'})`, value: c.id ?? '' }))

  return (
    <Field className='w-full sm:w-80'>
      <FieldLabel htmlFor='employee-company'>{t('employee.company_picker.label')}</FieldLabel>
      <Select
        items={items}
        value={companyId ?? null}
        onValueChange={(value) => value && setQuery({ companyId: value })}
        disabled={isLoading}
      >
        <SelectTrigger id='employee-company' className='h-[38px] w-full bg-white'>
          <Building2 className='text-muted-foreground' />
          <SelectValue placeholder={t('employee.company_picker.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

/** Shown in place of the page body until a super admin picks a company */
export function PickCompanyHint({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <div className='bg-card text-muted-foreground flex flex-col items-center gap-2 rounded-xl border p-10 text-center'>
      <Building2 className='size-8' />
      <p>{message ?? t('employee.company_picker.hint')}</p>
    </div>
  )
}
