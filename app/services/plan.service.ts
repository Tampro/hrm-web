import { axiosClient } from '~/configs/axios.config'
import { API_PLAN } from '~/shared/constants/api.constant'
import type { IApiResponse } from '~/shared/models/common.model'
import type { IPlan } from '~/shared/models/plan.model'

export const PlanService = {
  GetAdminList: async (): Promise<IApiResponse<IPlan[]>> => await axiosClient.get(API_PLAN.ADMIN_LIST_URL)
}
