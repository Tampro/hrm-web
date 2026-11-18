import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { CompanyService } from '~/services/company.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { ICompanyListParams } from '~/shared/models/company.model'

export const useGetListCompanyApi = createListApiHook(QUERY_KEY.COMPANY.GET_LIST, CompanyService.GetListCompany)

export const useGetCompanyInfoApi = createDetailApiHook(QUERY_KEY.COMPANY.GET_INFO, CompanyService.GetInfo)

export const useGetCompanyStatusCountsApi = (
  params: Omit<ICompanyListParams, 'status' | 'page' | 'size' | 'sort'>,
  enabled = true
) =>
  useQuery({
    queryKey: [QUERY_KEY.COMPANY.GET_STATUS_COUNTS, params],
    queryFn: () => CompanyService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

/** Plan picker of the Upgrade plan dialog — same query as the Plans page (shared cache) */
export { useGetAdminPlanListApi as useGetAdminPlansApi } from '~/hooks/apis/use-plan-api'

/** Refresh everything a company write can change (list, tab counts, info panel) */
export const useInvalidateCompanies = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.COMPANY.GET_LIST] }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.COMPANY.GET_STATUS_COUNTS] }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.COMPANY.GET_INFO] })
    ])
}
