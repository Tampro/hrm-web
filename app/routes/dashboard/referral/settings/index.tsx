import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { dateHelper } from '~/helpers/date.helper'
import { getReferralSettingsSchema, type TReferralSettingsSchema } from '~/helpers/schema.helper'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useInvalidateReferral, useReferralSettingsApi } from '~/hooks/apis/use-referral-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { ReferralService } from '~/services/referral.service'
import { EReferralSettingsFormKey } from '~/shared/enums/form.enum'
import type { IReferralSettings } from '~/shared/models/referral.model'

const DEFAULT_VALUES: TReferralSettingsSchema = {
  [EReferralSettingsFormKey.Enabled]: false,
  [EReferralSettingsFormKey.CommissionPercentage]: '',
  [EReferralSettingsFormKey.ThresholdAmount]: '',
  [EReferralSettingsFormKey.Guidelines]: ''
}

const toText = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))

const toFormValues = (settings: IReferralSettings): TReferralSettingsSchema => ({
  enabled: !!settings.enabled,
  commissionPercentage: toText(settings.commissionPercentage),
  thresholdAmount: toText(settings.thresholdAmount),
  guidelines: settings.guidelines ?? ''
})

// Referral Settings. Spec: GET / PUT /saas/admin/referral/settings (SettingsForm, full replacement)
export default function ReferralSettingsPage() {
  const { t } = useTranslation()
  const invalidate = useInvalidateReferral()
  const { data: currency } = useDefaultCurrencyApi()
  const { data: settings, isLoading } = useReferralSettingsApi()

  const form = useForm<TReferralSettingsSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getReferralSettingsSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (settings) form.reset(toFormValues(settings))
  }, [settings, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TReferralSettingsSchema) =>
      ReferralService.UpdateSettings({
        enabled: values.enabled,
        commissionPercentage: Number(values.commissionPercentage),
        thresholdAmount: Number(values.thresholdAmount),
        guidelines: values.guidelines || undefined
      }),
    onSuccess: async () => {
      toast.success(t('referral.settings.saved'))
      await invalidate()
    }
  })

  if (isLoading) return <Skeleton className='h-96 w-full max-w-2xl rounded-xl' />

  return (
    <form
      className='bg-card flex max-w-2xl min-w-0 flex-col gap-6 rounded-xl border p-6'
      onSubmit={form.handleSubmit((values) => mutate(values))}
      noValidate
    >
      <FieldGroup>
        <FormSwitchField
          control={form.control}
          name={EReferralSettingsFormKey.Enabled}
          label={t('referral.settings.enabled')}
          description={t('referral.settings.enabled_hint')}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormInputField
            control={form.control}
            name={EReferralSettingsFormKey.CommissionPercentage}
            label={t('referral.settings.commission_percentage')}
            description={t('coupon.form.percent_hint')}
            inputMode='decimal'
            required
          />
          <FormInputField
            control={form.control}
            name={EReferralSettingsFormKey.ThresholdAmount}
            label={t('referral.settings.threshold_amount', { unit: currency?.symbol || currency?.code || '' })}
            description={t('referral.settings.threshold_hint')}
            inputMode='decimal'
            required
          />
        </div>
        <Controller
          name={EReferralSettingsFormKey.Guidelines}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='referral-guidelines'>{t('referral.settings.guidelines')}</FieldLabel>
              <Textarea
                {...field}
                id='referral-guidelines'
                rows={8}
                aria-invalid={fieldState.invalid}
                className='max-h-96 [overflow-wrap:anywhere]'
              />
              <FieldDescription>{t('referral.settings.guidelines_hint')}</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <span className='text-muted-foreground text-sm'>
          {t('referral.settings.updated_at', { date: dateHelper.formatDateTime(settings?.updatedDate) })}
        </span>
        <Button type='submit' className='h-[38px]' disabled={isPending}>
          {isPending ? t('common.saving') : t('referral.settings.save')}
        </Button>
      </div>
    </form>
  )
}
