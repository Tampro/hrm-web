import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { CurrencyService, OrderService, PlanRequestService, PlanService } from '~/services/plan.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { IOrderListParams, IPlanRequestListParams } from '~/shared/models/saas.model'

type TCountParams<T> = Omit<T, 'status' | 'page' | 'size' | 'sort'>

export const useGetAdminPlanListApi = (enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.PLAN.GET_ADMIN_LIST],
    queryFn: PlanService.GetAdminList,
    select: (res) => res?.data ?? [],
    enabled
  })

/** Default currency (the API returns the default first) — used to display prices */
export const useDefaultCurrencyApi = (enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.CURRENCY.GET_LIST],
    queryFn: CurrencyService.GetList,
    select: (res) => res?.data?.find((c) => c.defaultCurrency) ?? res?.data?.[0],
    staleTime: 10 * 60 * 1000,
    enabled
  })

export const useGetListPlanRequestApi = createListApiHook(
  QUERY_KEY.PLAN_REQUEST.GET_LIST,
  PlanRequestService.GetListPlanRequest
)

export const useGetPlanRequestStatusCountsApi = (params: TCountParams<IPlanRequestListParams>, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.PLAN_REQUEST.GET_STATUS_COUNTS, params],
    queryFn: () => PlanRequestService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

export const useGetListOrderApi = createListApiHook(QUERY_KEY.ORDER.GET_LIST, OrderService.GetListOrder)

export const useGetOrderStatusCountsApi = (params: TCountParams<IOrderListParams>, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ORDER.GET_STATUS_COUNTS, params],
    queryFn: () => OrderService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

export const useGetOrderDetailApi = createDetailApiHook(QUERY_KEY.ORDER.GET_DETAIL, OrderService.GetDetail)

/** Approving a request/order changes companies' plans too: refresh every SaaS list on the page */
export const useInvalidateSaas = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [
        QUERY_KEY.PLAN.GET_ADMIN_LIST,
        QUERY_KEY.PLAN_REQUEST.GET_LIST,
        QUERY_KEY.PLAN_REQUEST.GET_STATUS_COUNTS,
        QUERY_KEY.ORDER.GET_LIST,
        QUERY_KEY.ORDER.GET_STATUS_COUNTS,
        QUERY_KEY.ORDER.GET_DETAIL,
        QUERY_KEY.COMPANY.GET_LIST
      ].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    )
}
