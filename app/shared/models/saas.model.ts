import type { EBillingCycle } from '~/shared/enums/company.enum'
import type { EPaymentMethod, ESaasRequestStatus } from '~/shared/enums/saas.enum'
import type { IBaseFilterPanel, IBasePagination } from '~/shared/models/common.model'

type TRequestStatus = Exclude<ESaasRequestStatus, ESaasRequestStatus.All>

// Spec: PlanRequestDto
export interface IPlanRequest {
  id?: string
  companyId?: string
  companyName?: string
  companyEmail?: string
  planId?: string
  planName?: string
  billingCycle?: EBillingCycle
  message?: string | null
  status?: TRequestStatus
  createdDate?: string
  processedAt?: string | null
  notes?: string | null
  orderId?: string | null
}

// Spec: GET /saas/admin/plan-requests — keyword matches company name/code/email or plan name
export interface IPlanRequestListParams extends IBasePagination, IBaseFilterPanel {
  status?: TRequestStatus
}

// Spec: BankTransferDto
export interface IBankTransfer {
  bankName?: string
  accountNumber?: string
  accountName?: string
  transferContent?: string
}

// Spec: OrderDto
export interface IOrder {
  id?: string
  orderNumber?: string
  companyId?: string
  planId?: string
  billingCycle?: EBillingCycle
  couponCode?: string | null
  originalPrice?: number | null
  discountAmount?: number | null
  finalPrice?: number | null
  paymentMethod?: EPaymentMethod
  paymentReference?: string | null
  status?: TRequestStatus
  createdDate?: string
  processedAt?: string | null
  notes?: string | null
  bankTransfer?: IBankTransfer | null
}

// Spec: AdminOrderDto — list rows and GET /saas/admin/orders/{id}
export interface IAdminOrder {
  order?: IOrder
  companyName?: string
  companyEmail?: string
  planName?: string
}

// Spec: GET /saas/admin/orders — keyword matches order number or company name/code/email; days inclusive (UTC)
export interface IOrderListParams extends IBasePagination, IBaseFilterPanel {
  dateFrom?: string
  dateTo?: string
  status?: TRequestStatus
}

// Spec: SaasDtos.StatusCountsDto(all, pending, approved, rejected, cancelled) — used by requests and orders
export interface ISaasStatusCounts {
  all?: number
  pending?: number
  approved?: number
  rejected?: number
  cancelled?: number
}

// Spec: OrderDecisionForm — note shown to the company (reason when rejecting), ≤ 500
export interface IDecisionPayload {
  notes?: string
}

// Spec: CurrencyDto (hrm-be CurrencyService.java). Exactly one default currency at any time
export interface ICurrency {
  id?: string
  code?: string
  name?: string
  symbol?: string | null
  description?: string | null
  defaultCurrency?: boolean
  createdDate?: string
  updatedDate?: string
}

// Spec: GET /saas/admin/currencies — keyword matches name, code or symbol
export interface ICurrencyListParams extends IBasePagination, IBaseFilterPanel {}

// Spec: CurrencyForm — full replacement: an omitted symbol / description is cleared
export interface ICurrencyPayload {
  name: string
  code: string
  symbol?: string
  description?: string
  defaultCurrency: boolean
}
