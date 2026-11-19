import { commonHelper } from '~/helpers/common.helper'
import type {
  TCompanyFilterSchema,
  TCouponFilterSchema,
  TKeywordFilterSchema,
  TSaasFilterSchema
} from '~/helpers/schema.helper'
import type { TEmployeeFilterSchema } from '~/helpers/schemas/employee.schema'
import type { THolidayFilterSchema } from '~/helpers/schemas/holiday.schema'
import type { TDepartmentFilterSchema, TDesignationFilterSchema } from '~/helpers/schemas/org.schema'
import { DEFAULT_PAGE, DEFAULT_SIZE } from '~/hooks/use-pagination'
import { ECompanyStatus } from '~/shared/enums/company.enum'
import { ECouponStatusTab } from '~/shared/enums/coupon.enum'
import { EEmployeeStatus } from '~/shared/enums/employee.enum'
import type { EOrgStatus } from '~/shared/enums/org.enum'
import { EPayoutStatus } from '~/shared/enums/referral.enum'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'

const pick = (searchParams: URLSearchParams, key: string, fallback: string) => searchParams.get(key) ?? fallback

export const paramsHelper = {
  paginationToSearchParams: (searchParams: URLSearchParams) => ({
    page: commonHelper.toPositiveInt(searchParams.get('page'), DEFAULT_PAGE),
    size: commonHelper.toPositiveInt(searchParams.get('size'), DEFAULT_SIZE)
  }),

  /** Every param the companies page owns; values already in the URL win over defaults */
  companyToSearchParams: (searchParams: URLSearchParams, defaults: TCompanyFilterSchema, tab: ECompanyStatus) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    createdFrom: pick(searchParams, 'createdFrom', defaults.createdFrom),
    createdTo: pick(searchParams, 'createdTo', defaults.createdTo),
    tab
  }),

  /** Every param the plan requests / plan orders pages own (requests ignore the dates) */
  saasToSearchParams: (
    searchParams: URLSearchParams,
    defaults: TSaasFilterSchema,
    tab: ESaasRequestStatus,
    { withDates }: { withDates: boolean }
  ) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    ...(withDates && {
      dateFrom: pick(searchParams, 'dateFrom', defaults.dateFrom),
      dateTo: pick(searchParams, 'dateTo', defaults.dateTo)
    }),
    tab
  }),

  /** Every param the coupons page owns */
  couponToSearchParams: (searchParams: URLSearchParams, defaults: TCouponFilterSchema, tab: ECouponStatusTab) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    type: pick(searchParams, 'type', defaults.type),
    dateFrom: pick(searchParams, 'dateFrom', defaults.dateFrom),
    dateTo: pick(searchParams, 'dateTo', defaults.dateTo),
    tab
  }),

  /** Every param the currencies page owns */
  currencyToSearchParams: (searchParams: URLSearchParams, defaults: TKeywordFilterSchema) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    keyword: pick(searchParams, 'keyword', defaults.keyword)
  }),

  /** Referred users / payout requests: keyword (+ tab for payouts) */
  keywordToSearchParams: (searchParams: URLSearchParams, tab?: string) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    keyword: pick(searchParams, 'keyword', ''),
    ...(tab && { tab })
  }),

  /** Employees page: company (super admin), filters, status tab */
  employeeToSearchParams: (
    searchParams: URLSearchParams,
    defaults: TEmployeeFilterSchema,
    tab: EEmployeeStatus,
    companyId?: string
  ) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    companyId,
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    branchId: pick(searchParams, 'branchId', defaults.branchId),
    departmentId: pick(searchParams, 'departmentId', defaults.departmentId),
    designationId: pick(searchParams, 'designationId', defaults.designationId),
    tab
  }),

  /** Departments page: company (super admin), keyword, branch, status tab */
  departmentToSearchParams: (
    searchParams: URLSearchParams,
    defaults: TDepartmentFilterSchema,
    tab: EOrgStatus,
    companyId?: string
  ) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    companyId,
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    branchId: pick(searchParams, 'branchId', defaults.branchId),
    tab
  }),

  /** Designations page: company (super admin), keyword, department, status tab */
  designationToSearchParams: (
    searchParams: URLSearchParams,
    defaults: TDesignationFilterSchema,
    tab: EOrgStatus,
    companyId?: string
  ) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    companyId,
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    departmentId: pick(searchParams, 'departmentId', defaults.departmentId),
    tab
  }),

  /** Holidays page: company (super admin), filters, list / calendar view */
  holidayToSearchParams: (
    searchParams: URLSearchParams,
    defaults: THolidayFilterSchema,
    view: string,
    companyId?: string
  ) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    companyId,
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    categoryId: pick(searchParams, 'categoryId', defaults.categoryId),
    year: pick(searchParams, 'year', defaults.year),
    dateFrom: pick(searchParams, 'dateFrom', defaults.dateFrom),
    dateTo: pick(searchParams, 'dateTo', defaults.dateTo),
    view
  }),

  getEmployeeTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EEmployeeStatus), EEmployeeStatus.All),

  /** Tab from ?tab=, falls back to All for unknown values */
  getCompanyTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(ECompanyStatus), ECompanyStatus.All),

  getCouponTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(ECouponStatusTab), ECouponStatusTab.All),

  getPayoutTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EPayoutStatus), EPayoutStatus.All),

  getSaasTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(ESaasRequestStatus), ESaasRequestStatus.All)
}
