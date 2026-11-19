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

// Spec: employee-service EmployeeController + EmployeeFileController (super admin passes companyId)
export const API_EMPLOYEE = {
  LIST_URL: '/employees',
  STATUS_COUNTS_URL: '/employees/status-counts',
  ORG_CHART_URL: '/employees/org-chart',
  EXPORT_URL: '/employees/export',
  IMPORT_URL: '/employees/import',
  IMPORT_TEMPLATE_URL: '/employees/import/template',
  DETAIL_URL: (id: string) => '/employees/' + id,
  STATUS_URL: (id: string) => '/employees/' + id + '/status',
  LOGIN_URL: (id: string) => '/employees/' + id + '/login',
  PASSWORD_URL: (id: string) => '/employees/' + id + '/password',
  DOCUMENTS_URL: (id: string) => '/employees/' + id + '/documents',
  DOCUMENT_URL: (id: string, documentId: string) => '/employees/' + id + '/documents/' + documentId,
  DOCUMENT_VERIFY_URL: (id: string, documentId: string) => '/employees/' + id + '/documents/' + documentId + '/verify',
  LETTER_URL: (id: string, type: string) => '/employees/' + id + '/letters/' + type
} as const

// Spec: employee-service org dropdowns (active items only) and document types
export const API_ORG = {
  BRANCHES_URL: '/org/branches',
  BRANCH_URL: (id: string) => '/org/branches/' + id,
  BRANCH_STATUS_URL: (id: string) => '/org/branches/' + id + '/status',
  BRANCH_OPTIONS_URL: '/org/branches/options',
  DEPARTMENTS_URL: '/org/departments',
  DEPARTMENT_STATUS_COUNTS_URL: '/org/departments/status-counts',
  DEPARTMENT_URL: (id: string) => '/org/departments/' + id,
  DEPARTMENT_STATUS_URL: (id: string) => '/org/departments/' + id + '/status',
  DEPARTMENT_OPTIONS_URL: '/org/departments/options',
  DESIGNATIONS_URL: '/org/designations',
  DESIGNATION_URL: (id: string) => '/org/designations/' + id,
  DESIGNATION_STATUS_URL: (id: string) => '/org/designations/' + id + '/status',
  DESIGNATION_OPTIONS_URL: '/org/designations/options',
  DOCUMENT_TYPES_URL: '/org/document-types'
} as const

// Spec: employee-service HolidayController (ORG_VIEW to read, ORG_MANAGE to write; super admin passes companyId)
export const API_HOLIDAY = {
  LIST_URL: '/org/holidays',
  CALENDAR_URL: '/org/holidays/calendar',
  EXPORT_PDF_URL: '/org/holidays/export/pdf',
  EXPORT_ICAL_URL: '/org/holidays/export/ical',
  DETAIL_URL: (id: string) => '/org/holidays/' + id,
  CATEGORIES_URL: '/org/holiday-categories',
  CATEGORY_URL: (id: string) => '/org/holiday-categories/' + id
} as const

// Spec: employee-service AnnouncementController (super admin passes companyId)
export const API_ANNOUNCEMENT = {
  LIST_URL: '/org/announcements',
  TAB_COUNTS_URL: '/org/announcements/tab-counts',
  DETAIL_URL: (id: string) => '/org/announcements/' + id,
  STATISTICS_URL: (id: string) => '/org/announcements/' + id + '/statistics',
  CATEGORIES_URL: '/org/announcement-categories',
  CATEGORY_URL: (id: string) => '/org/announcement-categories/' + id
} as const

// Spec: media-service MediaController — upload (multipart `files`), returns the stored files
export const API_MEDIA = {
  FILES_URL: '/media/files'
} as const

// Spec: EmailTemplateController (super admin) — list, detail, From Name, content per language, preview
export const API_EMAIL_TEMPLATE = {
  LIST_URL: '/settings/admin/email-templates',
  DETAIL_URL: (id: string) => '/settings/admin/email-templates/' + id,
  SETTINGS_URL: (id: string) => '/settings/admin/email-templates/' + id + '/settings',
  CONTENT_URL: (id: string, lang: string) => '/settings/admin/email-templates/' + id + '/content/' + lang,
  PREVIEW_URL: (id: string, lang: string) => '/settings/admin/email-templates/' + id + '/preview/' + lang
} as const
