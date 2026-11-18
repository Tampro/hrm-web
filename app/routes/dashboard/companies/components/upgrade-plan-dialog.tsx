import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Skeleton } from '~/components/ui/skeleton'
import { commonHelper } from '~/helpers/common.helper'
import { getUpgradePlanSchema, type TUpgradePlanSchema } from '~/helpers/schema.helper'
import { useGetAdminPlansApi, useInvalidateCompanies } from '~/hooks/apis/use-company-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { cn } from '~/lib/utils'
import { CompanyService } from '~/services/company.service'
import { DATA } from '~/shared/constants/data.constant'
import { EBillingCycle } from '~/shared/enums/company.enum'
import { EUpgradePlanFormKey } from '~/shared/enums/form.enum'
import type { ICompany } from '~/shared/models/company.model'

const DEFAULT_VALUES: TUpgradePlanSchema = {
  [EUpgradePlanFormKey.PlanId]: '',
  [EUpgradePlanFormKey.BillingCycle]: EBillingCycle.Monthly
}

interface IProps {
  company: ICompany | undefined
  onClose: () => void
}

/**
 * Spec: PUT /iam/companies/{id}/plan — moves the company to the plan for one billing cycle, starting now
 * (or extends the running period of the same plan); recorded as an APPROVED MANUAL order.
 */
export function UpgradePlanDialog({ company: companyProp, onClose }: IProps) {
  const company = useLastDefined(companyProp)
  const { t } = useTranslation()
  const invalidate = useInvalidateCompanies()
  const { data: plans = [], isLoading } = useGetAdminPlansApi(!!company)
  // TODO(assumption): only enabled plans can be assigned — confirm with BE whether a disabled plan is rejected
  const selectablePlans = plans.filter((plan) => plan.enabled !== false)

  const form = useForm<TUpgradePlanSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getUpgradePlanSchema(t)),
    mode: 'all'
  })
  const billingCycle = useWatch({ control: form.control, name: EUpgradePlanFormKey.BillingCycle })

  useEffect(() => {
    form.reset({ ...DEFAULT_VALUES, planId: companyProp?.planId ?? '' })
  }, [companyProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TUpgradePlanSchema) =>
      CompanyService.UpgradePlan(company?.id ?? '', {
        planId: Number(values.planId),
        billingCycle: values.billingCycle
      }),
    onSuccess: async () => {
      toast.success(t('company.toast.plan_upgraded'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={!!companyProp} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t('company.upgrade.title')}</DialogTitle>
          <DialogDescription>
            {t('company.upgrade.description', { name: company?.name ?? '-', plan: company?.planName || '-' })}
          </DialogDescription>
        </DialogHeader>
        <form id='upgrade-plan-form' onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
          <FieldGroup>
            <Controller
              name={EUpgradePlanFormKey.BillingCycle}
              control={form.control}
              render={({ field }) => (
                <TabsCustom
                  value={field.value}
                  onChange={field.onChange}
                  options={DATA.GET_BILLING_CYCLE_OPTIONS(t)}
                  isNoSyncParams
                />
              )}
            />
            <Controller
              name={EUpgradePlanFormKey.PlanId}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('company.upgrade.plan')}</FieldLabel>
                  {isLoading && <Skeleton className='h-20 w-full' />}
                  {!isLoading && selectablePlans.length === 0 && (
                    <p className='text-muted-foreground text-sm'>{t('company.upgrade.no_plans')}</p>
                  )}
                  <div role='radiogroup' aria-label={t('company.upgrade.plan')} className='grid gap-2 sm:grid-cols-2'>
                    {selectablePlans.map((plan) => {
                      const price = billingCycle === EBillingCycle.Yearly ? plan.yearlyPrice : plan.monthlyPrice
                      const checked = field.value === plan.id
                      return (
                        <button
                          key={plan.id}
                          type='button'
                          role='radio'
                          aria-checked={checked}
                          onClick={() => field.onChange(plan.id ?? '')}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                            checked ? 'border-primary bg-primary/5 ring-primary ring-1' : 'hover:bg-muted'
                          )}
                        >
                          <span className='font-medium'>{plan.name || '-'}</span>
                          <span className='text-muted-foreground text-sm'>
                            {price === null || price === undefined
                              ? t('company.upgrade.no_price')
                              : t(
                                  billingCycle === EBillingCycle.Yearly
                                    ? 'company.upgrade.per_year'
                                    : 'company.upgrade.per_month',
                                  {
                                    price: commonHelper.formatNumber(price, 2)
                                  }
                                )}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {t('company.upgrade.max_users', {
                              count: plan.maxUsers ?? 0,
                              value: plan.maxUsers === null || plan.maxUsers === undefined ? '∞' : plan.maxUsers
                            })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='upgrade-plan-form' className='h-[38px]' disabled={isPending || isLoading}>
            {isPending ? t('common.saving') : t('company.upgrade.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
