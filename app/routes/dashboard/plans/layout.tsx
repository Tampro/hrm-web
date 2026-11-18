import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Tabs } from '~/components/common/tabs'
import { Skeleton } from '~/components/ui/skeleton'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { PageLayout } from '~/layouts/page.layout'
import { DATA } from '~/shared/constants/data.constant'

export function meta() {
  return [{ title: 'Plans · SPECOM HRM' }]
}

// Manual 3.2.3 Plans management (Super Admin): Plans / Plan Requests / Plan Orders.
// Spec: every /saas/admin/* endpoint requires superAdmin; the FE only hides the section.
export default function PlansLayout() {
  const { t } = useTranslation()
  const { data: me, isLoading } = useMeApi()

  if (isLoading) {
    return (
      <PageLayout>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-40 w-full' />
      </PageLayout>
    )
  }

  if (!me?.superAdmin) {
    return (
      <PageLayout>
        <div className='bg-card text-muted-foreground flex flex-col items-center gap-2 rounded-xl border p-10 text-center'>
          <ShieldAlert className='size-8' />
          <p>{t('common.no_permission')}</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div>
        <h1 className='text-xl font-semibold'>{t('plan.title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('plan.subtitle')}</p>
      </div>
      <Tabs items={DATA.GET_PLAN_SECTION_TABS(t)} />
      <Outlet />
    </PageLayout>
  )
}
