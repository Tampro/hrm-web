import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Skeleton } from '~/components/ui/skeleton'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { PageLayout } from '~/layouts/page.layout'

export function meta() {
  return [{ title: 'Coupons · SPECOM HRM' }]
}

// Manual 3.2.4 Coupons (Super Admin). Spec: every /saas/admin/coupons endpoint requires superAdmin; the FE only hides.
export default function CouponsLayout() {
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

  return <Outlet />
}
