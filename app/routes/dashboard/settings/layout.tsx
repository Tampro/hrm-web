import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'

import { cn } from '~/lib/utils'
import { PageLayout } from '~/layouts/page.layout'
import { DATA } from '~/shared/constants/data.constant'

export function meta() {
  return [{ title: 'Settings · SPECOM HRM' }]
}

// System settings (super admin): one route per section, vertical menu on the left.
// Access is checked by layouts/super-admin.layout.tsx (parent route).
export default function SettingsLayout() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <div>
        <h1 className='text-xl font-semibold'>{t('settings.title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('settings.subtitle')}</p>
      </div>
      <div className='grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]'>
        <nav aria-label={t('settings.menu')} className='bg-card h-fit rounded-xl border p-2'>
          <ul className='flex flex-row flex-wrap gap-1 lg:flex-col'>
            {DATA.GET_SETTINGS_SECTIONS(t).map((item) => (
              <li key={item.route}>
                <NavLink
                  to={item.route}
                  className={({ isActive }) =>
                    cn(
                      'hover:bg-muted block rounded-md px-3 py-2 text-sm',
                      isActive && 'bg-primary/10 text-primary font-medium'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className='min-w-0'>
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}
