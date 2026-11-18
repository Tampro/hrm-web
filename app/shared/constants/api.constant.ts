// Spec: IAM Swagger http://localhost:8081/v3/api-docs (paths relative to VITE_BASE_URL_API = /api/v1)
export const API_AUTH = {
  LOGIN_URL: '/auth/login',
  REFRESH_TOKEN_URL: '/auth/refresh-token',
  LOGOUT_URL: '/auth/logout',
  ME_URL: '/me'
} as const
