import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import type { TEmployeeSchema } from '~/helpers/schemas/employee.schema'
import { EEmployeeFormKey } from '~/shared/enums/form.enum'

import { EmployeeFormSection } from './employee-form-section'

interface IProps {
  form: UseFormReturn<TEmployeeSchema>
  /** Spec: banking is ignored (and not returned) without EMPLOYEE_BANKING_VIEW */
  canEditBanking: boolean
}

export function StepBanking({ form, canEditBanking }: IProps) {
  const { t } = useTranslation()
  const { control } = form

  if (!canEditBanking) {
    return (
      <p role='note' className='bg-card text-muted-foreground rounded-xl border p-6 text-sm'>
        {t('employee.banking_no_access')}
      </p>
    )
  }

  return (
    <EmployeeFormSection title={t('employee.section.banking')}>
      <FormInputField control={control} name={EEmployeeFormKey.BankName} label={t('employee.field.bank_name')} />
      <FormInputField
        control={control}
        name={EEmployeeFormKey.AccountHolderName}
        label={t('employee.field.account_holder_name')}
      />
      <FormInputField
        control={control}
        name={EEmployeeFormKey.AccountNumber}
        label={t('employee.field.account_number')}
        autoComplete='off'
      />
      <FormInputField
        control={control}
        name={EEmployeeFormKey.BankIdentifierCode}
        label={t('employee.field.bank_identifier_code')}
      />
      <FormInputField control={control} name={EEmployeeFormKey.BankBranch} label={t('employee.field.bank_branch')} />
      <FormInputField
        control={control}
        name={EEmployeeFormKey.TaxPayerId}
        label={t('employee.field.tax_payer_id')}
        autoComplete='off'
      />
      <FormInputField
        control={control}
        name={EEmployeeFormKey.BaseSalary}
        label={t('employee.field.base_salary')}
        inputMode='decimal'
      />
    </EmployeeFormSection>
  )
}
