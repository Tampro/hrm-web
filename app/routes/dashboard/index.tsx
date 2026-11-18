import { useTranslation } from 'react-i18next'

import { useMeApi } from '~/hooks/apis/use-auth-api'
import { PageLayout } from '~/layouts/page.layout'

// Placeholder home until the dashboard is built: shows who is signed in
export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: me, isLoading } = useMeApi()

  return (
    <PageLayout>
      <h1 className='text-xl font-semibold'>{t('dashboard.welcome', { name: me?.username ?? '-' })}</h1>
      {!isLoading && (
        <p className='text-muted-foreground text-sm'>
          {t('dashboard.roles')}: {me?.roles?.length ? me.roles.join(', ') : '-'}
        </p>
      )}
    </PageLayout>
  )
}
