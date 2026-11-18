import type { IBaseFilterPanel, IBasePagination } from '~/shared/models/common.model'
import type { EPayoutStatus } from '~/shared/enums/referral.enum'

// Spec: hrm-be ReferralDtos.java. Money is in the default currency.

// Spec: SettingsDto
export interface IReferralSettings {
  enabled?: boolean
  commissionPercentage?: number | null
  thresholdAmount?: number | null
  guidelines?: string | null
  updatedDate?: string | null
}

// Spec: SettingsForm — full replacement: omitted guidelines are cleared
export interface IReferralSettingsPayload {
  enabled: boolean
  commissionPercentage: number
  thresholdAmount: number
  guidelines?: string
}

// Spec: TopReferrerDto
export interface ITopReferrer {
  companyId?: string
  companyName?: string
  companyEmail?: string
  referrals?: number
  commissionEarned?: number | null
}

// Spec: DashboardDto — four cards, top referring companies, this year's figures
export interface IReferralDashboard {
  totalReferredCompanies?: number
  pendingPayouts?: number | null
  totalCommissionPaid?: number | null
  activeReferredCompanies?: number
  topReferrers?: ITopReferrer[]
  referralSignupsThisYear?: number
  payoutsProcessedThisYear?: number | null
}

// Spec: CommissionDto — one commission earned from a referred company's order
export interface ICommission {
  orderId?: string
  orderAmount?: number | null
  commissionPercentage?: number | null
  amount?: number | null
  createdDate?: string
}

// Spec: ReferredCompanyDto
export interface IReferredCompany {
  companyId?: string
  companyName?: string
  companyEmail?: string
  registeredAt?: string
  referrerCompanyId?: string
  referrerName?: string
  planName?: string | null
  planMonthlyPrice?: number | null
  commission?: number | null
  commissionHistory?: ICommission[]
}

// Spec: ReferredSummaryDto
export interface IReferredSummary {
  totalReferred?: number
  withPlans?: number
  totalCommission?: number | null
}

// Spec: GET /saas/admin/referral/referred — keyword matches company name or email
export interface IReferredListParams extends IBasePagination, IBaseFilterPanel {}

// Spec: PayoutDto
export interface IPayout {
  id?: string
  companyId?: string
  companyName?: string
  companyEmail?: string
  amount?: number | null
  status?: Exclude<EPayoutStatus, EPayoutStatus.All>
  notes?: string | null
  createdDate?: string
  processedAt?: string | null
}

// Spec: GET /saas/admin/referral/payouts — keyword matches company name or email; status = tab
export interface IPayoutListParams extends IBasePagination, IBaseFilterPanel {
  status?: Exclude<EPayoutStatus, EPayoutStatus.All>
}

// Spec: PayoutCountsDto(all, pending, approved, rejected)
export interface IPayoutStatusCounts {
  all?: number
  pending?: number
  approved?: number
  rejected?: number
}
