import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { StatCards } from '~/components/customs/stat-cards'
import { TableCustom } from '~/components/customs/table-custom'
import { Skeleton } from '~/components/ui/skeleton'
import { referralMgtColumn } from '~/helpers/columns/referral-mgt-column'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useReferralDashboardApi } from '~/hooks/apis/use-referral-api'
import { DATA } from '~/shared/constants/data.constant'

// Referral Dashboard. Spec: GET /saas/admin/referral/dashboard (DashboardDto); money in the default currency
export default function ReferralDashboardPage() {
  const { t } = useTranslation()
  const { data: currency } = useDefaultCurrencyApi()
  const { data: dashboard, isLoading } = useReferralDashboardApi()
  const columns = useMemo(() => referralMgtColumn.getTopReferrer(t, currency), [t, currency])
  const topReferrers = useMemo(
    () => (dashboard?.topReferrers ?? []).map((row, index) => ({ ...row, id: row.companyId ?? String(index) })),
    [dashboard]
  )

  return (
    <>
      <StatCards
        label={t('referral.dashboard.summary')}
        items={DATA.GET_REFERRAL_DASHBOARD_CARDS(t, dashboard, currency)}
        loading={isLoading}
      />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <TableCustom
          headerTitle={t('referral.dashboard.top_referrers')}
          columns={columns}
          data={topReferrers}
          loading={isLoading}
          disableNavigationAll
          emptyText={t('referral.dashboard.no_referrers')}
        />
        <section className='bg-card flex flex-col gap-3 rounded-xl border p-4'>
          <h2 className='text-base font-semibold'>{t('referral.dashboard.this_year')}</h2>
          {isLoading ? (
            <Skeleton className='h-16 w-full' />
          ) : (
            <InfoRows rows={DATA.GET_REFERRAL_YEAR_ROWS(t, dashboard, currency)} />
          )}
        </section>
      </div>
    </>
  )
}
