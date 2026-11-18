import type { ECouponCodeGeneration, ECouponType } from '~/shared/enums/coupon.enum'
import type { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import type { IBaseFilterPanel, IBasePagination } from '~/shared/models/common.model'

type TCouponType = Exclude<ECouponType, ECouponType.All>

// Spec: CouponDto (hrm-be CouponDtos.java). Missing limits / spends (null) = none / unlimited.
// timesUsed counts PENDING + APPROVED orders (a rejected or cancelled order gives the use back).
export interface ICoupon {
  id?: string
  code?: string
  codeGeneration?: ECouponCodeGeneration
  name?: string
  type?: TCouponType
  discountValue?: number | null
  minimumSpend?: number | null
  maximumSpend?: number | null
  useLimitTotal?: number | null
  useLimitPerCompany?: number | null
  /** Last valid day (UTC), YYYY-MM-DD; null = no expiry */
  expiryDate?: string | null
  enabled?: boolean
  timesUsed?: number | null
  createdDate?: string
}

// Spec: GET /saas/admin/coupons — keyword matches name or code; dateFrom/dateTo = inclusive UTC creation days;
// active true = tab Active, false = Inactive, omitted = All
export interface ICouponListParams extends IBasePagination, IBaseFilterPanel {
  type?: TCouponType
  dateFrom?: string
  dateTo?: string
  active?: boolean
}

// Spec: CouponCountsDto(all, active, inactive)
export interface ICouponStatusCounts {
  all?: number
  active?: number
  inactive?: number
}

// Spec: CouponUsageDto — one order that used the coupon
export interface ICouponUsage {
  orderId?: string
  orderNumber?: string
  companyId?: string
  companyName?: string
  companyEmail?: string
  orderAmount?: number | null
  discountApplied?: number | null
  finalPrice?: number | null
  status?: Exclude<ESaasRequestStatus, ESaasRequestStatus.All>
  usedAt?: string
}

// Spec: CouponDetailDto — usage history newest first
export interface ICouponDetail {
  coupon?: ICoupon
  usageHistory?: ICouponUsage[]
}

// Spec: CouponForm. PUT replaces every field: omitted limits become unlimited; AUTO keeps the current code
export interface ICouponPayload {
  name: string
  type: TCouponType
  discountValue: number
  codeGeneration: ECouponCodeGeneration
  code?: string
  minimumSpend?: number
  maximumSpend?: number
  useLimitTotal?: number
  useLimitPerCompany?: number
  expiryDate?: string
  enabled?: boolean
}
