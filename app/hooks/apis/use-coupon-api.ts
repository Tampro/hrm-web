import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { CouponService } from '~/services/coupon.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { ICouponListParams } from '~/shared/models/coupon.model'

export const useGetListCouponApi = createListApiHook(QUERY_KEY.COUPON.GET_LIST, CouponService.GetListCoupon)

export const useGetCouponDetailApi = createDetailApiHook(QUERY_KEY.COUPON.GET_DETAIL, CouponService.GetDetail)

export const useGetCouponStatusCountsApi = (params: Omit<ICouponListParams, 'active' | 'page' | 'size' | 'sort'>) =>
  useQuery({
    queryKey: [QUERY_KEY.COUPON.GET_STATUS_COUNTS, params],
    queryFn: () => CouponService.GetStatusCounts(params),
    select: (res) => res?.data
  })

/** Refresh everything a coupon write can change (list, tab counts, detail page) */
export const useInvalidateCoupons = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [QUERY_KEY.COUPON.GET_LIST, QUERY_KEY.COUPON.GET_STATUS_COUNTS, QUERY_KEY.COUPON.GET_DETAIL].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    )
}
