import { axiosClient } from '~/configs/axios.config'
import { API_REFERRAL } from '~/shared/constants/api.constant'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  IPayout,
  IPayoutListParams,
  IPayoutStatusCounts,
  IReferralDashboard,
  IReferralSettings,
  IReferralSettingsPayload,
  IReferredCompany,
  IReferredListParams,
  IReferredSummary
} from '~/shared/models/referral.model'
import type { IDecisionPayload } from '~/shared/models/saas.model'

export const ReferralService = {
  GetDashboard: async (): Promise<IApiResponse<IReferralDashboard>> =>
    await axiosClient.get(API_REFERRAL.ADMIN_DASHBOARD_URL),
  GetListReferred: async (params?: IReferredListParams): Promise<IApiResponse<IApiPagination<IReferredCompany>>> =>
    await axiosClient.get(API_REFERRAL.ADMIN_REFERRED_URL, { params }),
  GetReferredSummary: async (): Promise<IApiResponse<IReferredSummary>> =>
    await axiosClient.get(API_REFERRAL.ADMIN_REFERRED_SUMMARY_URL),
  GetListPayout: async (params?: IPayoutListParams): Promise<IApiResponse<IApiPagination<IPayout>>> =>
    await axiosClient.get(API_REFERRAL.ADMIN_PAYOUTS_URL, { params }),
  GetPayoutStatusCounts: async (params?: { keyword?: string }): Promise<IApiResponse<IPayoutStatusCounts>> =>
    await axiosClient.get(API_REFERRAL.ADMIN_PAYOUT_STATUS_COUNTS_URL, { params }),
  ApprovePayout: async (id: string, payload: IDecisionPayload): Promise<IApiResponse<IPayout>> =>
    await axiosClient.post(API_REFERRAL.ADMIN_PAYOUT_APPROVE_URL(id), payload),
  RejectPayout: async (id: string, payload: IDecisionPayload): Promise<IApiResponse<IPayout>> =>
    await axiosClient.post(API_REFERRAL.ADMIN_PAYOUT_REJECT_URL(id), payload),
  GetSettings: async (): Promise<IApiResponse<IReferralSettings>> =>
    await axiosClient.get(API_REFERRAL.ADMIN_SETTINGS_URL),
  UpdateSettings: async (payload: IReferralSettingsPayload): Promise<IApiResponse<IReferralSettings>> =>
    await axiosClient.put(API_REFERRAL.ADMIN_SETTINGS_URL, payload)
}
