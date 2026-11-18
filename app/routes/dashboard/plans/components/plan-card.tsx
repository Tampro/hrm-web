import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { commonHelper } from '~/helpers/common.helper'
import { cn } from '~/lib/utils'
import { DATA } from '~/shared/constants/data.constant'
import { EBillingCycle } from '~/shared/enums/company.enum'
import type { IPlan } from '~/shared/models/plan.model'
import type { ICurrency } from '~/shared/models/saas.model'

interface IProps {
  plan: IPlan
  billingCycle: EBillingCycle
  currency?: ICurrency
  isToggling?: boolean
  onToggle: (plan: IPlan, enabled: boolean) => void
  onEdit: (plan: IPlan) => void
  onDelete: (plan: IPlan) => void
}

/** Manual 3.2.3 plan card: name, price, description, trial, limits, features, Active toggle, Edit / Delete */
export function PlanCard({ plan, billingCycle, currency, isToggling, onToggle, onEdit, onDelete }: IProps) {
  const { t } = useTranslation()
  const isYearly = billingCycle === EBillingCycle.Yearly
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  // Spec: SAAS_013 the default plan cannot be deleted, SAAS_015 it cannot be made inactive
  const isDefault = !!plan.defaultPlan

  return (
    <article
      aria-label={plan.name || '-'}
      className={cn('bg-card flex flex-col gap-4 rounded-xl border p-5', !plan.enabled && 'opacity-70')}
    >
      <header className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 flex-col gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='truncate text-base font-semibold'>{plan.name || '-'}</h3>
            {isDefault && <Badge>{t('plan.default')}</Badge>}
          </div>
          <span className='text-muted-foreground text-xs'>{plan.code || '-'}</span>
        </div>
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <Switch
              checked={!!plan.enabled}
              disabled={isDefault || isToggling}
              onCheckedChange={(checked) => onToggle(plan, checked)}
              aria-label={t('plan.field.enabled_for', { name: plan.name ?? '' })}
            />
          </TooltipTrigger>
          <TooltipContent>{isDefault ? t('plan.default_cannot_disable') : t('plan.field.enabled')}</TooltipContent>
        </Tooltip>
      </header>

      <div>
        {price === null || price === undefined ? (
          <p className='text-muted-foreground text-sm'>{t('plan.no_yearly_price')}</p>
        ) : (
          <p className='text-2xl font-semibold' data-testid='plan-price'>
            {commonHelper.formatMoney(price, currency)}
            <span className='text-muted-foreground text-sm font-normal'>
              {' / '}
              {isYearly ? t('plan.per_year') : t('plan.per_month')}
            </span>
          </p>
        )}
        {!!plan.trialDays && <p className='text-primary text-sm'>{t('plan.trial_days', { count: plan.trialDays })}</p>}
      </div>

      {plan.description && <p className='text-muted-foreground text-sm'>{plan.description}</p>}

      <section className='flex flex-col gap-2'>
        <h4 className='text-sm font-medium'>{t('plan.included')}</h4>
        <InfoRows rows={DATA.GET_PLAN_LIMIT_ROWS(t, plan)} />
      </section>

      <section className='flex flex-col gap-2'>
        <h4 className='text-sm font-medium'>{t('plan.features')}</h4>
        <p className='flex items-center gap-2 text-sm'>
          {plan.aiIntegration ? (
            <Check className='text-primary size-4' />
          ) : (
            <X className='text-muted-foreground size-4' />
          )}
          {t('plan.field.ai_integration')}
          <span className='sr-only'>{plan.aiIntegration ? t('plan.enabled') : t('plan.disabled')}</span>
        </p>
      </section>

      <footer className='mt-auto flex gap-2 pt-2'>
        <Button variant='outline' className='h-[38px] flex-1' onClick={() => onEdit(plan)}>
          <Pencil />
          {t('common.edit')}
        </Button>
        <Tooltip>
          <TooltipTrigger render={<span className='flex-1' />}>
            <Button
              variant='outline'
              className='text-destructive h-[38px] w-full'
              disabled={isDefault}
              onClick={() => onDelete(plan)}
            >
              <Trash2 />
              {t('common.delete')}
            </Button>
          </TooltipTrigger>
          {isDefault && <TooltipContent>{t('plan.default_cannot_delete')}</TooltipContent>}
        </Tooltip>
      </footer>
    </article>
  )
}
