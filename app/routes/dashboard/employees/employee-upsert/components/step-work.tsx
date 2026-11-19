import { useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormDateField } from '~/components/forms/form-date-field'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import type { TEmployeeSchema } from '~/helpers/schemas/employee.schema'
import {
  useBranchOptionsApi,
  useDepartmentOptionsApi,
  useDesignationOptionsApi,
  useManagerOptionsApi
} from '~/hooks/apis/use-employee-api'
import { DATA } from '~/shared/constants/data.constant'
import { EEmployeeFormKey } from '~/shared/enums/form.enum'
import type { IRef } from '~/shared/models/employee.model'

import { EmployeeFormSection } from './employee-form-section'

interface IProps {
  form: UseFormReturn<TEmployeeSchema>
  companyId?: string
  /** edit: the employee itself (cannot report to themselves, Spec: EMP_028) */
  employeeId?: string
  /** edit: saved org values, kept in the lists even when that item is now inactive (options list active items only) */
  current?: { branch?: IRef | null; department?: IRef | null; designation?: IRef | null; reportsTo?: IRef | null }
}

/** Options from the API plus the saved value when the API no longer lists it */
const withCurrent = (items: { label: string; value: string }[], current?: IRef | null) =>
  current?.id && !items.some((i) => i.value === current.id)
    ? [...items, { label: current.name ?? current.id, value: current.id }]
    : items

export function StepWork({ form, companyId, employeeId, current }: IProps) {
  const { t } = useTranslation()
  const { control, setValue } = form
  const [branchId, departmentId] = useWatch({
    control,
    name: [EEmployeeFormKey.BranchId, EEmployeeFormKey.DepartmentId]
  })
  const { data: branches = [] } = useBranchOptionsApi(companyId)
  const { data: departments = [] } = useDepartmentOptionsApi(companyId, branchId || undefined)
  const { data: designations = [] } = useDesignationOptionsApi(companyId, departmentId || undefined)
  const { data: managers = [] } = useManagerOptionsApi(companyId)

  const none = { label: t('employee.none'), value: '' }
  const toItems = (list: { id?: string; name?: string }[]) =>
    list.map((x) => ({ label: x.name ?? '-', value: x.id ?? '' }))

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <EmployeeFormSection title={t('employee.section.organization')}>
        {/* changing a level clears the narrower ones (Spec: EMP_003 / EMP_004 department in branch, designation in department) */}
        <>
          <FormSelectField
            control={control}
            name={EEmployeeFormKey.BranchId}
            label={t('employee.field.branch')}
            options={[none, ...withCurrent(toItems(branches), current?.branch)]}
            onValueChange={() => {
              setValue(EEmployeeFormKey.DepartmentId, '')
              setValue(EEmployeeFormKey.DesignationId, '')
            }}
          />
          <FormSelectField
            control={control}
            name={EEmployeeFormKey.DepartmentId}
            label={t('employee.field.department')}
            options={[none, ...withCurrent(toItems(departments), current?.department)]}
            disabled={!branchId}
            onValueChange={() => setValue(EEmployeeFormKey.DesignationId, '')}
          />
          <FormSelectField
            control={control}
            name={EEmployeeFormKey.DesignationId}
            label={t('employee.field.designation')}
            options={[none, ...withCurrent(toItems(designations), current?.designation)]}
            disabled={!departmentId}
          />
        </>
        <FormSelectField
          control={control}
          name={EEmployeeFormKey.ReportsToId}
          label={t('employee.field.reports_to')}
          options={[
            none,
            ...withCurrent(
              managers
                .filter((m) => m.id !== employeeId)
                .map((m) => ({ label: `${m.fullName ?? '-'} (${m.employeeNo ?? '-'})`, value: m.id ?? '' })),
              current?.reportsTo
            )
          ]}
        />
      </EmployeeFormSection>

      <EmployeeFormSection title={t('employee.section.employment')}>
        <FormInputField
          control={control}
          name={EEmployeeFormKey.EmployeeCode}
          label={t('employee.field.employee_code')}
          description={t('employee.employee_code_hint')}
        />
        <FormDateField
          control={control}
          name={EEmployeeFormKey.DateOfJoining}
          label={t('employee.field.date_of_joining')}
          required
        />
        <FormSelectField
          control={control}
          name={EEmployeeFormKey.EmploymentType}
          label={t('employee.field.employment_type')}
          options={DATA.GET_EMPLOYMENT_TYPE_OPTIONS(t)}
        />
        <FormSelectField
          control={control}
          name={EEmployeeFormKey.Status}
          label={t('employee.field.status')}
          options={DATA.GET_EMPLOYEE_STATUS_OPTIONS(t)}
        />
      </EmployeeFormSection>
    </div>
  )
}
