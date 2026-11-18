import { commonHelper } from '~/helpers/common.helper'
import type { TCompanyFilterSchema, TCouponFilterSchema, TSaasFilterSchema } from '~/helpers/schema.helper'
import { DEFAULT_PAGE, DEFAULT_SIZE } from '~/hooks/use-pagination'
import { ECompanyStatus } from '~/shared/enums/company.enum'
import { ECouponStatusTab } from '~/shared/enums/coupon.enum'
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

  /** Tab from ?tab=, falls back to All for unknown values */
  getCompanyTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(ECompanyStatus), ECompanyStatus.All),

  getCouponTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(ECouponStatusTab), ECouponStatusTab.All),

  getSaasTab: (searchParams: URLSearchParams) =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(ESaasRequestStatus), ESaasRequestStatus.All)
}
