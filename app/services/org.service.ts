import { axiosClient } from '~/configs/axios.config'
import { API_ORG } from '~/shared/constants/api.constant'
import type { EOrgStatus } from '~/shared/enums/org.enum'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type { IBranch, IBranchListParams, IBranchPayload } from '~/shared/models/org.model'

// Spec: employee-service BranchController (ORG_VIEW to read, ORG_MANAGE to write; super admin passes companyId)
export const BranchService = {
  GetList: async (params?: IBranchListParams): Promise<IApiResponse<IApiPagination<IBranch>>> =>
    await axiosClient.get(API_ORG.BRANCHES_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IBranch>> => await axiosClient.get(API_ORG.BRANCH_URL(id)),
  Create: async (companyId: string | undefined, payload: IBranchPayload): Promise<IApiResponse<IBranch>> =>
    await axiosClient.post(API_ORG.BRANCHES_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IBranchPayload): Promise<IApiResponse<IBranch>> =>
    await axiosClient.put(API_ORG.BRANCH_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IBranch>> =>
    await axiosClient.put(API_ORG.BRANCH_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ORG.BRANCH_URL(id))
}
