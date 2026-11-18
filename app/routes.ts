import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

import { BASE_ROUTES } from './shared/constants/routes.constant'

export default [
  index('layouts/root-redirect.tsx'),
  layout('layouts/auth.layout.tsx', [route(`${BASE_ROUTES.AUTH}/login`, 'routes/auth/login/index.tsx')]),
  layout('layouts/private.layout.tsx', [
    layout('layouts/dashboard.layout.tsx', [
      route(BASE_ROUTES.DASHBOARD, 'routes/dashboard/index.tsx'),
      route(`${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.COMPANIES}`, 'routes/dashboard/companies/index.tsx')
    ])
  ])
] satisfies RouteConfig
