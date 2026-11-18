// Spec: IAM Swagger http://localhost:8081/v3/api-docs (paths relative to VITE_BASE_URL_API = /api/v1)
export const API_AUTH = {
  LOGIN_URL: '/auth/login',
  REFRESH_TOKEN_URL: '/auth/refresh-token',
  LOGOUT_URL: '/auth/logout',
  ME_URL: '/me'
} as const

// Spec: "Companies (super admin)" — CompanyController, all endpoints require superAdmin
export const API_COMPANY = {
  LIST_URL: '/iam/companies',
  STATUS_COUNTS_URL: '/iam/companies/status-counts',
  DETAIL_URL: (id: string) => `/iam/companies/${id}`,
  INFO_URL: (id: string) => `/iam/companies/${id}/info`,
  STATUS_URL: (id: string) => `/iam/companies/${id}/status`,
  PLAN_URL: (id: string) => `/iam/companies/${id}/plan`,
  RESET_PASSWORD_URL: (id: string) => `/iam/companies/${id}/reset-password`
} as const

// Spec: SaaS admin — all plans, enabled or not
export const API_PLAN = {
  ADMIN_LIST_URL: '/saas/admin/plans'
} as const
