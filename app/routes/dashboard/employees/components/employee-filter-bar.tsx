import { Search } from 'lucide-react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { TEmployeeFilterSchema } from '~/helpers/schemas/employee.schema'
import { useBranchOptionsApi, useDepartmentOptionsApi, useDesignationOptionsApi } from '~/hooks/apis/use-employee-api'
import { EEmployeeFilterFormKey } from '~/shared/enums/form.enum'

interface IProps {
  form: UseFormReturn<TEmployeeFilterSchema>
  companyId?: string
  onSearch: () => void
  onReset: () => void
}

/** Keyword + branch → department → designation (each level narrows the next, Spec: options endpoints) */
export function EmployeeFilterBar({ form, companyId, onSearch, onReset }: IProps) {
  const { t } = useTranslation()
  const [branchId, departmentId] = useWatch({
    control: form.control,
    name: [EEmployeeFilterFormKey.BranchId, EEmployeeFilterFormKey.DepartmentId]
  })
  const { data: branches = [] } = useBranchOptionsApi(companyId)
  const { data: departments = [] } = useDepartmentOptionsApi(companyId, branchId || undefined)
  const { data: designations = [] } = useDesignationOptionsApi(companyId, departmentId || undefined)

  const all = { label: t('employee.filter.all'), value: '' }
  const selects = [
    {
      name: EEmployeeFilterFormKey.BranchId,
      label: t('employee.field.branch'),
      items: [all, ...branches.map((b) => ({ label: b.name ?? '-', value: b.id ?? '' }))],
      // a new branch invalidates the narrower picks
      clear: [EEmployeeFilterFormKey.DepartmentId, EEmployeeFilterFormKey.DesignationId] as const
    },
    {
      name: EEmployeeFilterFormKey.DepartmentId,
      label: t('employee.field.department'),
      items: [all, ...departments.map((d) => ({ label: d.name ?? '-', value: d.id ?? '' }))],
      clear: [EEmployeeFilterFormKey.DesignationId] as const,
      disabled: !branchId
    },
    {
      name: EEmployeeFilterFormKey.DesignationId,
      label: t('employee.field.designation'),
      items: [all, ...designations.map((d) => ({ label: d.name ?? '-', value: d.id ?? '' }))],
      clear: [] as const,
      disabled: !departmentId
    }
  ]

  return (
    <form
      className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]'
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
      noValidate
    >
      <Controller
        name={EEmployeeFilterFormKey.Keyword}
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='employee-keyword'>{t('saas.filter.keyword')}</FieldLabel>
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input
                {...field}
                id='employee-keyword'
                placeholder={t('employee.keyword_placeholder')}
                className='h-[38px] pl-8'
              />
            </div>
          </Field>
        )}
      />
      {selects.map((select) => (
        <Controller
          key={select.name}
          name={select.name}
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`employee-filter-${select.name}`}>{select.label}</FieldLabel>
              <Select
                items={select.items}
                value={field.value}
                disabled={select.disabled}
                onValueChange={(value) => {
                  field.onChange(value ?? '')
                  select.clear.forEach((key) => form.setValue(key, ''))
                }}
              >
                <SelectTrigger id={`employee-filter-${select.name}`} className='h-[38px] w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {select.items.map((item) => (
                    <SelectItem key={item.value || 'all'} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      ))}
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
