import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

import { BASE_ROUTES } from './shared/constants/routes.constant'

export default [
  index('layouts/root-redirect.tsx'),
  layout('layouts/auth.layout.tsx', [route(`${BASE_ROUTES.AUTH}/login`, 'routes/auth/login/index.tsx')]),
  layout('layouts/private.layout.tsx', [
    layout('layouts/dashboard.layout.tsx', [
      route(BASE_ROUTES.DASHBOARD, 'routes/dashboard/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.COMPANIES}`, 'routes/dashboard/companies/index.tsx'),
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
        route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.CURRENCIES}`, 'routes/dashboard/currencies/index.tsx')
      ])
    ])
  ])
] satisfies RouteConfig
