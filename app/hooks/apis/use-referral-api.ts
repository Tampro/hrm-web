import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createListApiHook } from '~/hooks/use-query-api'
import { ReferralService } from '~/services/referral.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

export const useReferralDashboardApi = () =>
  useQuery({
    queryKey: [QUERY_KEY.REFERRAL.GET_DASHBOARD],
    queryFn: ReferralService.GetDashboard,
    select: (res) => res?.data
  })

export const useGetListReferredApi = createListApiHook(QUERY_KEY.REFERRAL.GET_REFERRED, ReferralService.GetListReferred)

export const useReferredSummaryApi = () =>
  useQuery({
    queryKey: [QUERY_KEY.REFERRAL.GET_REFERRED_SUMMARY],
    queryFn: ReferralService.GetReferredSummary,
    select: (res) => res?.data
  })

export const useGetListPayoutApi = createListApiHook(QUERY_KEY.REFERRAL.GET_PAYOUTS, ReferralService.GetListPayout)

export const usePayoutStatusCountsApi = (params: { keyword?: string }) =>
  useQuery({
    queryKey: [QUERY_KEY.REFERRAL.GET_PAYOUT_STATUS_COUNTS, params],
    queryFn: () => ReferralService.GetPayoutStatusCounts(params),
    select: (res) => res?.data
  })

export const useReferralSettingsApi = () =>
  useQuery({
    queryKey: [QUERY_KEY.REFERRAL.GET_SETTINGS],
    queryFn: ReferralService.GetSettings,
    select: (res) => res?.data
  })

/** A payout decision changes the payout list, its counts and the dashboard cards */
export const useInvalidateReferral = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(Object.values(QUERY_KEY.REFERRAL).map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}
