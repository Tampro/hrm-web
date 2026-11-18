import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { commonHelper } from '~/helpers/common.helper'
import { useDefaultCurrencyApi, useGetAdminPlanListApi, useInvalidateSaas } from '~/hooks/apis/use-plan-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { useQueryParams } from '~/hooks/use-query-params'
import { PlanService } from '~/services/plan.service'
import { DATA } from '~/shared/constants/data.constant'
import { EBillingCycle } from '~/shared/enums/company.enum'
import type { IPlan } from '~/shared/models/plan.model'

import { PlanCard } from './components/plan-card'
import { PlanFormSheet } from './components/plan-form-sheet'

// Manual 3.2.3 Subscription Plans. Spec: GET /saas/admin/plans (all plans, enabled or not, no paging)
export default function PlansPage() {
  // Lib
  const { t } = useTranslation()
  const invalidate = useInvalidateSaas()

  // Query — the Monthly / Yearly view is kept in the URL (?cycle=)
  const { searchParams, updateQuery } = useQueryParams()
  const billingCycle = commonHelper.toEnumValue(
    searchParams.get('cycle'),
    Object.values(EBillingCycle),
    EBillingCycle.Monthly
  )

  // API
  const { data: plans = [], isLoading } = useGetAdminPlanListApi()
  const { data: currency } = useDefaultCurrencyApi()

  // Dialogs: form (null = create), delete confirmation
  const [formPlan, setFormPlan] = useState<IPlan | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IPlan | undefined>()

  const {
    mutate: toggle,
    variables: toggling,
    isPending: isToggling
  } = useMutationApi({
    mutationFn: ({ plan, enabled }: { plan: IPlan; enabled: boolean }) =>
      PlanService.ChangeStatus(plan.id ?? '', enabled),
    onSuccess: async (_, { enabled }) => {
      toast.success(t(enabled ? 'plan.toast.enabled' : 'plan.toast.disabled'))
      await invalidate()
    }
  })

  const { mutate: deletePlan, isPending: isDeleting } = useMutationApi({
    mutationFn: (plan: IPlan) => PlanService.Delete(plan.id ?? ''),
    onSuccess: async () => {
      toast.success(t('plan.toast.deleted'))
      await invalidate()
      setDeleting(undefined)
    }
  })

  // Default plan first, then enabled, then by monthly price
  const sorted = [...plans].sort(
    (a, b) =>
      Number(!!b.defaultPlan) - Number(!!a.defaultPlan) ||
      Number(!!b.enabled) - Number(!!a.enabled) ||
      (a.monthlyPrice ?? 0) - (b.monthlyPrice ?? 0)
  )

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <TabsCustom
          value={billingCycle}
          onChange={(cycle) => updateQuery('cycle', cycle)}
          options={DATA.GET_BILLING_CYCLE_OPTIONS(t)}
          isNoSyncParams
        />
        <Button className='h-[38px]' onClick={() => setFormPlan(null)}>
          <Plus />
          {t('plan.add')}
        </Button>
      </div>

      {isLoading && (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className='h-96 rounded-xl' />
          ))}
        </div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>{t('plan.empty')}</div>
      )}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {sorted.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            currency={currency}
            isToggling={isToggling && toggling?.plan.id === plan.id}
            onToggle={(target, enabled) => toggle({ plan: target, enabled })}
            onEdit={setFormPlan}
            onDelete={setDeleting}
          />
        ))}
      </div>

      <PlanFormSheet plan={formPlan} onClose={() => setFormPlan(undefined)} />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('plan.delete.title')}
        description={t('plan.delete.description', { name: deleting?.name ?? '-' })}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deletePlan(deleting)}
      />
    </>
  )
}
