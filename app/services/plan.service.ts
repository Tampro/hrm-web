import { axiosClient } from '~/configs/axios.config'
import { API_CURRENCY, API_ORDER, API_PLAN, API_PLAN_REQUEST } from '~/shared/constants/api.constant'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type { IPlan, IPlanPayload } from '~/shared/models/plan.model'
import type {
  IAdminOrder,
  ICurrency,
  ICurrencyListParams,
  ICurrencyPayload,
  IDecisionPayload,
  IOrder,
  IOrderListParams,
  IPlanRequest,
  IPlanRequestListParams,
  ISaasStatusCounts
} from '~/shared/models/saas.model'

type TCountParams<T> = Omit<T, 'status' | 'page' | 'size' | 'sort'>

export const PlanService = {
  GetAdminList: async (): Promise<IApiResponse<IPlan[]>> => await axiosClient.get(API_PLAN.ADMIN_LIST_URL),
  Create: async (payload: IPlanPayload): Promise<IApiResponse<IPlan>> =>
    await axiosClient.post(API_PLAN.ADMIN_LIST_URL, payload),
  Update: async (id: string, payload: IPlanPayload): Promise<IApiResponse<IPlan>> =>
    await axiosClient.put(API_PLAN.ADMIN_DETAIL_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_PLAN.ADMIN_DETAIL_URL(id)),
  ChangeStatus: async (id: string, enabled: boolean): Promise<IApiResponse<IPlan>> =>
    await axiosClient.put(API_PLAN.ADMIN_STATUS_URL(id), { enabled })
}

export const PlanRequestService = {
  GetListPlanRequest: async (params?: IPlanRequestListParams): Promise<IApiResponse<IApiPagination<IPlanRequest>>> =>
    await axiosClient.get(API_PLAN_REQUEST.ADMIN_LIST_URL, { params }),
  GetStatusCounts: async (params?: TCountParams<IPlanRequestListParams>): Promise<IApiResponse<ISaasStatusCounts>> =>
    await axiosClient.get(API_PLAN_REQUEST.ADMIN_STATUS_COUNTS_URL, { params }),
  Approve: async (id: string, payload: IDecisionPayload): Promise<IApiResponse<IPlanRequest>> =>
    await axiosClient.post(API_PLAN_REQUEST.ADMIN_APPROVE_URL(id), payload),
  Reject: async (id: string, payload: IDecisionPayload): Promise<IApiResponse<IPlanRequest>> =>
    await axiosClient.post(API_PLAN_REQUEST.ADMIN_REJECT_URL(id), payload)
}

export const OrderService = {
  GetListOrder: async (params?: IOrderListParams): Promise<IApiResponse<IApiPagination<IAdminOrder>>> =>
    await axiosClient.get(API_ORDER.ADMIN_LIST_URL, { params }),
  GetStatusCounts: async (params?: TCountParams<IOrderListParams>): Promise<IApiResponse<ISaasStatusCounts>> =>
    await axiosClient.get(API_ORDER.ADMIN_STATUS_COUNTS_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IAdminOrder>> =>
    await axiosClient.get(API_ORDER.ADMIN_DETAIL_URL(id)),
  Approve: async (id: string, payload: IDecisionPayload): Promise<IApiResponse<IOrder>> =>
    await axiosClient.post(API_ORDER.ADMIN_APPROVE_URL(id), payload),
  Reject: async (id: string, payload: IDecisionPayload): Promise<IApiResponse<IOrder>> =>
    await axiosClient.post(API_ORDER.ADMIN_REJECT_URL(id), payload)
}

export const CurrencyService = {
  GetList: async (): Promise<IApiResponse<ICurrency[]>> => await axiosClient.get(API_CURRENCY.LIST_URL),
  GetAdminListCurrency: async (params?: ICurrencyListParams): Promise<IApiResponse<IApiPagination<ICurrency>>> =>
    await axiosClient.get(API_CURRENCY.ADMIN_LIST_URL, { params }),
  GetAdminDetail: async (id: string): Promise<IApiResponse<ICurrency>> =>
    await axiosClient.get(API_CURRENCY.ADMIN_DETAIL_URL(id)),
  Create: async (payload: ICurrencyPayload): Promise<IApiResponse<ICurrency>> =>
    await axiosClient.post(API_CURRENCY.ADMIN_LIST_URL, payload),
  Update: async (id: string, payload: ICurrencyPayload): Promise<IApiResponse<ICurrency>> =>
    await axiosClient.put(API_CURRENCY.ADMIN_DETAIL_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_CURRENCY.ADMIN_DETAIL_URL(id))
}
