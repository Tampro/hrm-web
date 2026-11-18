import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Tabs } from '~/components/common/tabs'
import { PageLayout } from '~/layouts/page.layout'
import { DATA } from '~/shared/constants/data.constant'

export function meta() {
  return [{ title: 'Referral · SPECOM HRM' }]
}

// Referral program (super admin): Dashboard / Referred users / Payout requests / Settings.
// Access is checked by layouts/super-admin.layout.tsx (parent route).
export default function ReferralLayout() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <div>
        <h1 className='text-xl font-semibold'>{t('referral.title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('referral.subtitle')}</p>
      </div>
      <Tabs items={DATA.GET_REFERRAL_SECTION_TABS(t)} />
      <Outlet />
    </PageLayout>
  )
}
