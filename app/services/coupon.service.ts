import { axiosClient } from '~/configs/axios.config'
import { API_COUPON } from '~/shared/constants/api.constant'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  ICoupon,
  ICouponDetail,
  ICouponListParams,
  ICouponPayload,
  ICouponStatusCounts
} from '~/shared/models/coupon.model'

export const CouponService = {
  GetListCoupon: async (params?: ICouponListParams): Promise<IApiResponse<IApiPagination<ICoupon>>> =>
    await axiosClient.get(API_COUPON.ADMIN_LIST_URL, { params }),
  GetStatusCounts: async (
    params?: Omit<ICouponListParams, 'active' | 'page' | 'size' | 'sort'>
  ): Promise<IApiResponse<ICouponStatusCounts>> =>
    await axiosClient.get(API_COUPON.ADMIN_STATUS_COUNTS_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<ICouponDetail>> =>
    await axiosClient.get(API_COUPON.ADMIN_DETAIL_URL(id)),
  Create: async (payload: ICouponPayload): Promise<IApiResponse<ICoupon>> =>
    await axiosClient.post(API_COUPON.ADMIN_LIST_URL, payload),
  Update: async (id: string, payload: ICouponPayload): Promise<IApiResponse<ICoupon>> =>
    await axiosClient.put(API_COUPON.ADMIN_DETAIL_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_COUPON.ADMIN_DETAIL_URL(id)),
  ChangeStatus: async (id: string, enabled: boolean): Promise<IApiResponse<ICoupon>> =>
    await axiosClient.put(API_COUPON.ADMIN_STATUS_URL(id), { enabled })
}
