import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

import { BASE_ROUTES } from './shared/constants/routes.constant'
import { ESettingsSection } from './shared/enums/settings.enum'

export default [
  index('layouts/root-redirect.tsx'),
  layout('layouts/auth.layout.tsx', [route(`${BASE_ROUTES.AUTH}/login`, 'routes/auth/login/index.tsx')]),
  layout('layouts/private.layout.tsx', [
    layout('layouts/dashboard.layout.tsx', [
      route(BASE_ROUTES.DASHBOARD, 'routes/dashboard/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.COMPANIES}`, 'routes/dashboard/companies/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.BRANCHES}`, 'routes/dashboard/branches/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.DEPARTMENTS}`, 'routes/dashboard/departments/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.DESIGNATIONS}`, 'routes/dashboard/designations/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.HOLIDAYS}`, 'routes/dashboard/holidays/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.AWARD_TYPES}`, 'routes/dashboard/award-types/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.ANNOUNCEMENTS}`, 'routes/dashboard/announcements/index.tsx'),
      route(
        `${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.ANNOUNCEMENTS}/:id`,
        'routes/dashboard/announcements/announcement-detail/index.tsx'
      ),
      route(
        `${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.ANNOUNCEMENTS}/:id/${BASE_ROUTES.ANNOUNCEMENT_STATISTICS}`,
        'routes/dashboard/announcements/announcement-statistics/index.tsx'
      ),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.EMPLOYEES}`, 'routes/dashboard/employees/layout.tsx', [
        index('routes/dashboard/employees/index.tsx'),
        route(BASE_ROUTES.EMPLOYEE_CREATE, 'routes/dashboard/employees/employee-upsert/index.tsx', {
          id: 'employee-create'
        }),
        route(BASE_ROUTES.EMPLOYEE_ORG_CHART, 'routes/dashboard/employees/org-chart/index.tsx'),
        route(':id', 'routes/dashboard/employees/employee-detail/index.tsx'),
        route(`:id/${BASE_ROUTES.EMPLOYEE_EDIT}`, 'routes/dashboard/employees/employee-upsert/index.tsx', {
          id: 'employee-edit'
        })
      ]),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.PLANS}`, 'routes/dashboard/plans/layout.tsx', [
        index('routes/dashboard/plans/index.tsx'),
        route(BASE_ROUTES.PLAN_REQUESTS, 'routes/dashboard/plans/requests/index.tsx'),
        route(BASE_ROUTES.PLAN_ORDERS, 'routes/dashboard/plans/orders/index.tsx')
      ]),
      // super-admin-only sections
      layout('layouts/super-admin.layout.tsx', [
        route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.COUPONS}`, 'routes/dashboard/coupons/index.tsx'),
        route(
          `${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.COUPONS}/:id`,
          'routes/dashboard/coupons/coupon-detail/index.tsx'
        ),
        route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.CURRENCIES}`, 'routes/dashboard/currencies/index.tsx'),
        route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.EMAIL_TEMPLATES}`, 'routes/dashboard/email-templates/index.tsx'),
        route(
          `${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.EMAIL_TEMPLATES}/:id`,
          'routes/dashboard/email-templates/email-template-detail/index.tsx'
        ),
        route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.REFERRAL}`, 'routes/dashboard/referral/layout.tsx', [
          index('routes/dashboard/referral/index.tsx'),
          route(BASE_ROUTES.REFERRAL_REFERRED, 'routes/dashboard/referral/referred/index.tsx'),
          route(BASE_ROUTES.REFERRAL_PAYOUTS, 'routes/dashboard/referral/payouts/index.tsx'),
          route(BASE_ROUTES.REFERRAL_SETTINGS, 'routes/dashboard/referral/settings/index.tsx')
        ]),
        route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.SETTINGS}`, 'routes/dashboard/settings/layout.tsx', [
          index('routes/dashboard/settings/index.tsx'),
          route(ESettingsSection.System, 'routes/dashboard/settings/system/index.tsx'),
          route(ESettingsSection.Brand, 'routes/dashboard/settings/brand/index.tsx'),
          route(ESettingsSection.Currency, 'routes/dashboard/settings/currency/index.tsx'),
          route(ESettingsSection.Email, 'routes/dashboard/settings/email/index.tsx'),
          route(ESettingsSection.Payment, 'routes/dashboard/settings/payment/index.tsx'),
          route(ESettingsSection.Storage, 'routes/dashboard/settings/storage/index.tsx'),
          route(ESettingsSection.Seo, 'routes/dashboard/settings/seo/index.tsx'),
          route(ESettingsSection.Recaptcha, 'routes/dashboard/settings/recaptcha/index.tsx'),
          route(ESettingsSection.Cookie, 'routes/dashboard/settings/cookie/index.tsx')
        ])
      ])
    ])
  ])
] satisfies RouteConfig
