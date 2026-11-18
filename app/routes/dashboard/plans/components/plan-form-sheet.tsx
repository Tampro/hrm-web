import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { Button } from '~/components/ui/button'
import { FieldGroup, FieldSeparator } from '~/components/ui/field'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { getPlanSchema, type TPlanSchema } from '~/helpers/schema.helper'
import { useInvalidateSaas } from '~/hooks/apis/use-plan-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { PlanService } from '~/services/plan.service'
import { EPlanFormKey } from '~/shared/enums/form.enum'
import type { IPlan, IPlanPayload } from '~/shared/models/plan.model'

const DEFAULT_VALUES: TPlanSchema = {
  [EPlanFormKey.Code]: '',
  [EPlanFormKey.Name]: '',
  [EPlanFormKey.Description]: '',
  [EPlanFormKey.MonthlyPrice]: '',
  [EPlanFormKey.YearlyPrice]: '',
  [EPlanFormKey.MaxUsers]: '',
  [EPlanFormKey.MaxEmployees]: '',
  [EPlanFormKey.StorageLimitGb]: '',
  [EPlanFormKey.EnableTrial]: false,
  [EPlanFormKey.TrialDays]: '',
  [EPlanFormKey.AiIntegration]: false,
  [EPlanFormKey.Enabled]: true,
  [EPlanFormKey.DefaultPlan]: false
}

const toText = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))
const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value))

const toFormValues = (plan: IPlan): TPlanSchema => ({
  code: plan.code ?? '',
  name: plan.name ?? '',
  description: plan.description ?? '',
  monthlyPrice: toText(plan.monthlyPrice),
  yearlyPrice: toText(plan.yearlyPrice),
  maxUsers: toText(plan.maxUsers),
  maxEmployees: toText(plan.maxEmployees),
  storageLimitGb: toText(plan.storageLimitGb),
  enableTrial: !!plan.trialDays,
  trialDays: plan.trialDays ? String(plan.trialDays) : '',
  aiIntegration: !!plan.aiIntegration,
  enabled: !!plan.enabled,
  defaultPlan: !!plan.defaultPlan
})

// Spec: PlanForm — empty optional fields are omitted (= unlimited / no yearly billing); trialDays is a primitive int
const toPayload = (values: TPlanSchema): IPlanPayload => ({
  code: values.code,
  name: values.name,
  description: values.description || undefined,
  monthlyPrice: Number(values.monthlyPrice),
  yearlyPrice: toNumber(values.yearlyPrice),
  maxUsers: toNumber(values.maxUsers),
  maxEmployees: toNumber(values.maxEmployees),
  storageLimitGb: toNumber(values.storageLimitGb),
  trialDays: values.enableTrial ? Number(values.trialDays) : 0,
  aiIntegration: values.aiIntegration,
  defaultPlan: values.defaultPlan,
  enabled: values.enabled
})

interface IProps {
  /** `null` = create, a plan = edit, `undefined` = closed */
  plan: IPlan | null | undefined
  onClose: () => void
}

/** Manual 3.2.3 Create / Edit plan. Spec: POST /saas/admin/plans, PUT /saas/admin/plans/{id} (full replacement) */
export function PlanFormSheet({ plan: planProp, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateSaas()
  const plan = useLastDefined(planProp)
  const isOpen = planProp !== undefined
  const isEdit = !!plan
  // Spec: SAAS_015 the default plan cannot be made inactive; moving the default flag is done by setting it on another
  // plan. TODO(assumption): sending defaultPlan=false for the current default is not supported — the switch is locked.
  const isCurrentDefault = !!plan?.defaultPlan

  const form = useForm<TPlanSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getPlanSchema(t)),
    mode: 'all'
  })
  const enableTrial = useWatch({ control: form.control, name: EPlanFormKey.EnableTrial })

  useEffect(() => {
    if (planProp !== undefined) form.reset(planProp ? toFormValues(planProp) : DEFAULT_VALUES)
  }, [planProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TPlanSchema) =>
      plan?.id ? PlanService.Update(plan.id, toPayload(values)) : PlanService.Create(toPayload(values)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'plan.toast.updated' : 'plan.toast.created'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{t(isEdit ? 'plan.form.edit_title' : 'plan.form.create_title')}</SheetTitle>
          <SheetDescription>
            {t(isEdit ? 'plan.form.edit_description' : 'plan.form.create_description')}
          </SheetDescription>
        </SheetHeader>
        <form
          id='plan-form'
          className='flex-1 overflow-y-auto px-4 pb-4'
          onSubmit={form.handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name={EPlanFormKey.Code}
              label={t('plan.field.code')}
              description={t('plan.form.code_hint')}
              placeholder='STARTER'
              required
            />
            <FormInputField control={form.control} name={EPlanFormKey.Name} label={t('plan.field.name')} required />
            <FormInputField
              control={form.control}
              name={EPlanFormKey.Description}
              label={t('plan.field.description')}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={EPlanFormKey.MonthlyPrice}
                label={t('plan.field.monthly_price')}
                inputMode='decimal'
                required
              />
              <FormInputField
                control={form.control}
                name={EPlanFormKey.YearlyPrice}
                label={t('plan.field.yearly_price')}
                description={t('plan.form.yearly_hint')}
                inputMode='decimal'
              />
            </div>

            <FieldSeparator>{t('plan.form.limits_section')}</FieldSeparator>
            <p className='text-muted-foreground -mt-2 text-sm'>{t('plan.form.limits_hint')}</p>
            <div className='grid gap-4 sm:grid-cols-3'>
              <FormInputField
                control={form.control}
                name={EPlanFormKey.MaxUsers}
                label={t('plan.field.max_users')}
                inputMode='numeric'
              />
              <FormInputField
                control={form.control}
                name={EPlanFormKey.MaxEmployees}
                label={t('plan.field.max_employees')}
                inputMode='numeric'
              />
              <FormInputField
                control={form.control}
                name={EPlanFormKey.StorageLimitGb}
                label={t('plan.field.storage_limit_gb')}
                inputMode='decimal'
              />
            </div>

            <FieldSeparator>{t('plan.features')}</FieldSeparator>
            <FormSwitchField
              control={form.control}
              name={EPlanFormKey.AiIntegration}
              label={t('plan.field.ai_integration')}
            />
            <FormSwitchField
              control={form.control}
              name={EPlanFormKey.EnableTrial}
              label={t('plan.field.enable_trial')}
              description={t('plan.form.trial_hint')}
            />
            {enableTrial && (
              <FormInputField
                control={form.control}
                name={EPlanFormKey.TrialDays}
                label={t('plan.field.trial_days')}
                inputMode='numeric'
                required
              />
            )}

            <FieldSeparator>{t('plan.form.settings_section')}</FieldSeparator>
            <FormSwitchField
              control={form.control}
              name={EPlanFormKey.Enabled}
              label={t('plan.field.enabled')}
              description={isCurrentDefault ? t('plan.default_cannot_disable') : t('plan.form.enabled_hint')}
              disabled={isCurrentDefault}
            />
            <FormSwitchField
              control={form.control}
              name={EPlanFormKey.DefaultPlan}
              label={t('plan.field.default_plan')}
              description={isCurrentDefault ? t('plan.form.is_default_hint') : t('plan.form.default_hint')}
              disabled={isCurrentDefault}
            />
          </FieldGroup>
        </form>
        <SheetFooter className='flex-row justify-end border-t'>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='plan-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'plan.form.create_submit')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
