import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Skeleton } from '~/components/ui/skeleton'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { PageLayout } from '~/layouts/page.layout'

/** Spec: every employee read needs EMPLOYEE_VIEW (super admin passes). UX only: the backend checks every call. */
export default function EmployeesLayout() {
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

  if (!me?.superAdmin && !me?.permissions?.includes('EMPLOYEE_VIEW')) {
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
