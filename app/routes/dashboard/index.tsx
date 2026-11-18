import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { useLogout } from '~/hooks/use-auth'
import { AuthService } from '~/services/auth.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

// Placeholder home until the dashboard is built: shows who is signed in and allows logout
export default function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: [QUERY_KEY.AUTH.ME], queryFn: AuthService.GetMe })
  const { mutate: logout, isPending } = useLogout()
  const me = data?.data

  return (
    <main className='flex flex-col gap-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>{t('dashboard.welcome', { name: me?.username ?? '-' })}</h1>
        <Button variant='outline' className='h-[38px]' onClick={() => logout()} disabled={isPending}>
          {t('auth.logout')}
        </Button>
      </div>
      {!isLoading && (
        <p className='text-muted-foreground text-sm'>
          {t('dashboard.roles')}: {me?.roles?.length ? me.roles.join(', ') : '-'}
        </p>
      )}
    </main>
  )
}
