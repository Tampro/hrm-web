export const BASE_ROUTES = {
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  COMPANIES: 'companies'
} as const

export const ROUTES = {
  ROOT: '/',
  LOGIN: `/${BASE_ROUTES.AUTH}/login`,
  DASHBOARD: `/${BASE_ROUTES.DASHBOARD}`,
  COMPANIES: `/${BASE_ROUTES.DASHBOARD}/${BASE_ROUTES.COMPANIES}`
} as const
