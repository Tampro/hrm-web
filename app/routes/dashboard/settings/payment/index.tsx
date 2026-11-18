import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { getBankTransferSchema, type TBankTransferSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { EBankTransferFormKey } from '~/shared/enums/form.enum'
import { ESettingsSection } from '~/shared/enums/settings.enum'
import type { IBankTransferSettings } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

const DEFAULT_VALUES: TBankTransferSchema = {
  enabled: false,
  bankName: '',
  accountNumber: '',
  accountName: '',
  details: ''
}

// Spec: GET / PUT /settings/admin/payment/bank-transfer — shown with every pending plan order; empty account fields
// fall back to the SAAS_BANK_* environment values. Other gateways have no API yet.
export default function PaymentSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<IBankTransferSettings, IBankTransferSettings>(
    ESettingsSection.Payment
  )
  const form = useForm<TBankTransferSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getBankTransferSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (data)
      form.reset({
        enabled: !!data.enabled,
        bankName: data.bankName ?? '',
        accountNumber: data.accountNumber ?? '',
        accountName: data.accountName ?? '',
        details: data.details ?? ''
      })
  }, [data, form])

  const handleSave = form.handleSubmit((v) =>
    save({
      enabled: v.enabled,
      bankName: v.bankName || undefined,
      accountNumber: v.accountNumber || undefined,
      accountName: v.accountName || undefined,
      details: v.details || undefined
    })
  )

  return (
    <SettingsCard
      title={t('settings.payment.bank_transfer')}
      description={t('settings.payment.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={handleSave}
    >
      <FormSwitchField
        control={form.control}
        name={EBankTransferFormKey.Enabled}
        label={t('settings.payment.enabled')}
      />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormInputField control={form.control} name={EBankTransferFormKey.BankName} label={t('order.bank.bank_name')} />
        <FormInputField
          control={form.control}
          name={EBankTransferFormKey.AccountNumber}
          label={t('order.bank.account_number')}
          inputMode='numeric'
        />
        <FormInputField
          control={form.control}
          name={EBankTransferFormKey.AccountName}
          label={t('order.bank.account_name')}
        />
      </div>
      <FormTextareaField
        control={form.control}
        name={EBankTransferFormKey.Details}
        label={t('settings.payment.details')}
        description={t('settings.payment.fallback_hint')}
        rows={4}
      />
    </SettingsCard>
  )
}
