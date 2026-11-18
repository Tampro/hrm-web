// @ts-check
// Obviously fake companies (Spec: CompanyDto). Never real customer data.

export const COMPANY_ACTIVE = {
  id: '101',
  code: 'E2E_ALPHA',
  name: 'E2E Alpha Co',
  email: 'alpha@e2e.invalid',
  status: 'ACTIVE',
  subscriptionStatus: 'ACTIVE',
  planId: '2',
  planCode: 'PRO',
  planName: 'Pro',
  planExpiresAt: '2027-01-31T00:00:00Z',
  createdDate: '2026-11-02T03:00:00Z',
  updatedDate: '2026-11-02T03:00:00Z'
}

export const COMPANY_SUSPENDED = {
  id: '102',
  code: 'E2E_BETA',
  name: 'E2E Beta Co',
  email: 'beta@e2e.invalid',
  status: 'SUSPENDED',
  subscriptionStatus: 'TRIAL',
  planId: '1',
  planCode: 'FREE',
  planName: 'Free',
  planExpiresAt: null,
  createdDate: '2026-10-15T03:00:00Z',
  updatedDate: '2026-10-15T03:00:00Z'
}

/** Every field null — the backend may send null for any field (reviewer rule) */
export const COMPANY_ALL_NULL = {
  id: '103',
  code: null,
  name: null,
  email: null,
  status: null,
  subscriptionStatus: null,
  planId: null,
  planCode: null,
  planName: null,
  planExpiresAt: null,
  createdDate: null,
  updatedDate: null
}

export const COUNTS = { all: 2, active: 1, inactive: 1 }

/** Spec: PlanDto */
export const PLANS = [
  { id: '1', code: 'FREE', name: 'Free', monthlyPrice: 0, yearlyPrice: 0, maxUsers: 5, enabled: true },
  { id: '2', code: 'PRO', name: 'Pro', monthlyPrice: 29, yearlyPrice: 290, maxUsers: 50, enabled: true },
  {
    id: '3',
    code: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxUsers: null,
    enabled: true
  },
  { id: '4', code: 'LEGACY', name: 'Legacy Disabled', monthlyPrice: 9, yearlyPrice: 90, maxUsers: 10, enabled: false }
]

/** Spec: CompanyInfoDto */
export const INFO_ALPHA = {
  company: COMPANY_ACTIVE,
  userCount: 7,
  maxUsers: 50,
  administrators: [
    { id: '501', username: 'alpha.admin', email: 'admin@alpha.e2e.invalid', fullName: 'Alpha Admin', status: 'ACTIVE' },
    { id: '502', username: 'alpha.ops', email: 'ops@alpha.e2e.invalid', fullName: 'Alpha Ops', status: 'LOCKED' }
  ]
}
