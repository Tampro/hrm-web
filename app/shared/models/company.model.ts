import type { EBillingCycle, ECompanyStatus, ESubscriptionStatus } from '~/shared/enums/company.enum'
import type { IBaseFilterPanel, IBasePagination } from '~/shared/models/common.model'
import type { IUser } from '~/shared/models/user.model'

// Spec: CompanyDto (hrm-be CompanyDtos.java). planExpiresAt / createdDate are ISO instants (UTC)
export interface ICompany {
  id?: string
  code?: string
  name?: string
  email?: string
  status?: ECompanyStatus
  subscriptionStatus?: ESubscriptionStatus
  planId?: string
  planCode?: string
  planName?: string
  planExpiresAt?: string
  createdDate?: string
  updatedDate?: string
}

// Spec: GET /iam/companies — keyword matches name, code or email; dates are inclusive UTC days (YYYY-MM-DD)
export interface ICompanyListParams extends IBasePagination, IBaseFilterPanel {
  createdFrom?: string
  createdTo?: string
  status?: Exclude<ECompanyStatus, ECompanyStatus.All>
}

// Spec: CompanyDtos.StatusCountsDto(all, active, inactive).
// Swagger shows the plan-request StatusCountsDto instead (name clash) — reported to BE, code is the source.
export interface ICompanyStatusCounts {
  all?: number
  active?: number
  inactive?: number
}

// Spec: CompanyInfoDto
export interface ICompanyInfo {
  company?: ICompany
  userCount?: number
  maxUsers?: number | null
  administrators?: IUser[]
}

// Spec: CompanyCreateForm (code /[A-Z0-9_]+/ ≤50, name ≤255, email ≤255, admin required)
export interface ICompanyCreatePayload {
  code: string
  name: string
  email: string
  enableLogin: boolean
  admin: { username: string; email: string; fullName: string }
}

// Spec: CompanyCreatedDto — temporaryPassword is returned once
export interface ICompanyCreated {
  company?: ICompany
  admin?: { user?: IUser; temporaryPassword?: string }
}

// Spec: CompanyUpdateForm — full replacement of name and email; code is fixed
export interface ICompanyUpdatePayload {
  name: string
  email: string
}

// Spec: ResetPasswordForm — userId optional (default: first active COMPANY_ADMIN)
export interface IResetPasswordPayload {
  userId?: number
  newPassword: string
}

// Spec: UpgradePlanForm
export interface IUpgradePlanPayload {
  planId: number
  billingCycle: EBillingCycle
}
