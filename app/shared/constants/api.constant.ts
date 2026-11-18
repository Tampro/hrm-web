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

// Spec: SaaS admin plans — list (enabled or not), create, full-replacement update, soft delete, active toggle
export const API_PLAN = {
  ADMIN_LIST_URL: '/saas/admin/plans',
  ADMIN_DETAIL_URL: (id: string) => `/saas/admin/plans/${id}`,
  ADMIN_STATUS_URL: (id: string) => `/saas/admin/plans/${id}/status`
} as const

// Spec: SaaS admin plan requests (Plan Requests page)
export const API_PLAN_REQUEST = {
  ADMIN_LIST_URL: '/saas/admin/plan-requests',
  ADMIN_STATUS_COUNTS_URL: '/saas/admin/plan-requests/status-counts',
  ADMIN_APPROVE_URL: (id: string) => `/saas/admin/plan-requests/${id}/approve`,
  ADMIN_REJECT_URL: (id: string) => `/saas/admin/plan-requests/${id}/reject`
} as const

// Spec: SaaS admin orders (Plan Orders page)
export const API_ORDER = {
  ADMIN_LIST_URL: '/saas/admin/orders',
  ADMIN_STATUS_COUNTS_URL: '/saas/admin/orders/status-counts',
  ADMIN_DETAIL_URL: (id: string) => `/saas/admin/orders/${id}`,
  ADMIN_APPROVE_URL: (id: string) => `/saas/admin/orders/${id}/approve`,
  ADMIN_REJECT_URL: (id: string) => `/saas/admin/orders/${id}/reject`
} as const

// Spec: SaaS admin coupons (CouponController). DELETE is a soft delete: the code can be reused
export const API_COUPON = {
  ADMIN_LIST_URL: '/saas/admin/coupons',
  ADMIN_STATUS_COUNTS_URL: '/saas/admin/coupons/status-counts',
  ADMIN_DETAIL_URL: (id: string) => `/saas/admin/coupons/${id}`,
  ADMIN_STATUS_URL: (id: string) => `/saas/admin/coupons/${id}/status`
} as const

// Spec: currencies for pickers / price display, default first; admin CRUD (super admin). DELETE is permanent
export const API_CURRENCY = {
  LIST_URL: '/saas/currencies',
  ADMIN_LIST_URL: '/saas/admin/currencies',
  ADMIN_DETAIL_URL: (id: string) => `/saas/admin/currencies/${id}`
} as const

// Spec: referral program, super admin side (ReferralController). Money is in the default currency
export const API_REFERRAL = {
  ADMIN_DASHBOARD_URL: '/saas/admin/referral/dashboard',
  ADMIN_REFERRED_URL: '/saas/admin/referral/referred',
  ADMIN_REFERRED_SUMMARY_URL: '/saas/admin/referral/referred/summary',
  ADMIN_PAYOUTS_URL: '/saas/admin/referral/payouts',
  ADMIN_PAYOUT_STATUS_COUNTS_URL: '/saas/admin/referral/payouts/status-counts',
  ADMIN_PAYOUT_APPROVE_URL: (id: string) => `/saas/admin/referral/payouts/${id}/approve`,
  ADMIN_PAYOUT_REJECT_URL: (id: string) => `/saas/admin/referral/payouts/${id}/reject`,
  ADMIN_SETTINGS_URL: '/saas/admin/referral/settings'
} as const

// Spec: system settings (super admin), one GET + PUT per section; secrets are write-only
export const API_SETTINGS = {
  ADMIN_SECTION_URL: (section: string) => '/settings/admin/' + section,
  ADMIN_EMAIL_TEST_URL: '/settings/admin/email/test'
} as const
