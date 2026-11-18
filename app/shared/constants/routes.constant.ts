export const BASE_ROUTES = {
  AUTH: 'auth',
  DASHBOARD: 'dashboard'
} as const

export const ROUTES = {
  ROOT: '/',
  LOGIN: `/${BASE_ROUTES.AUTH}/login`,
  DASHBOARD: `/${BASE_ROUTES.DASHBOARD}`
} as const
