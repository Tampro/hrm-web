import { axiosClient } from '~/configs/axios.config'
import { API_COMPANY } from '~/shared/constants/api.constant'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  ICompany,
  ICompanyCreated,
  ICompanyCreatePayload,
  ICompanyInfo,
  ICompanyListParams,
  ICompanyStatusCounts,
  ICompanyUpdatePayload,
  IResetPasswordPayload,
  IUpgradePlanPayload
} from '~/shared/models/company.model'
import type { IUser } from '~/shared/models/user.model'

export const CompanyService = {
  GetListCompany: async (params?: ICompanyListParams): Promise<IApiResponse<IApiPagination<ICompany>>> =>
    await axiosClient.get(API_COMPANY.LIST_URL, { params }),
  GetStatusCounts: async (
    params?: Omit<ICompanyListParams, 'status' | 'page' | 'size' | 'sort'>
  ): Promise<IApiResponse<ICompanyStatusCounts>> => await axiosClient.get(API_COMPANY.STATUS_COUNTS_URL, { params }),
  GetInfo: async (id: string): Promise<IApiResponse<ICompanyInfo>> => await axiosClient.get(API_COMPANY.INFO_URL(id)),
  Create: async (payload: ICompanyCreatePayload): Promise<IApiResponse<ICompanyCreated>> =>
    await axiosClient.post(API_COMPANY.LIST_URL, payload),
  Update: async (id: string, payload: ICompanyUpdatePayload): Promise<IApiResponse<ICompany>> =>
    await axiosClient.put(API_COMPANY.DETAIL_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_COMPANY.DETAIL_URL(id)),
  ChangeStatus: async (id: string, status: ICompany['status']): Promise<IApiResponse<ICompany>> =>
    await axiosClient.put(API_COMPANY.STATUS_URL(id), { status }),
  UpgradePlan: async (id: string, payload: IUpgradePlanPayload): Promise<IApiResponse<unknown>> =>
    await axiosClient.put(API_COMPANY.PLAN_URL(id), payload),
  ResetPassword: async (id: string, payload: IResetPasswordPayload): Promise<IApiResponse<IUser>> =>
    await axiosClient.post(API_COMPANY.RESET_PASSWORD_URL(id), payload)
}
