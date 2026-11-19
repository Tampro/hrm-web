import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { BranchService, DepartmentService } from '~/services/org.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { IDepartmentListParams } from '~/shared/models/org.model'

export const useGetListBranchApi = createListApiHook(QUERY_KEY.ORG.GET_BRANCH_LIST, BranchService.GetList)

export const useGetBranchDetailApi = createDetailApiHook(QUERY_KEY.ORG.GET_BRANCH_DETAIL, BranchService.GetDetail)

/** A branch write changes the list, the detail and every branch dropdown (employees, departments) */
export const useInvalidateBranches = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [QUERY_KEY.ORG.GET_BRANCH_LIST, QUERY_KEY.ORG.GET_BRANCH_DETAIL, QUERY_KEY.ORG.GET_BRANCH_OPTIONS].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    )
}

export const useGetListDepartmentApi = createListApiHook(QUERY_KEY.ORG.GET_DEPARTMENT_LIST, DepartmentService.GetList)

export const useGetDepartmentDetailApi = createDetailApiHook(
  QUERY_KEY.ORG.GET_DEPARTMENT_DETAIL,
  DepartmentService.GetDetail
)

export const useGetDepartmentStatusCountsApi = (params: IDepartmentListParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ORG.GET_DEPARTMENT_STATUS_COUNTS, params],
    queryFn: () => DepartmentService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

/** A department write changes the list, tabs, detail and the department dropdowns (employees, designations) */
export const useInvalidateDepartments = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [
        QUERY_KEY.ORG.GET_DEPARTMENT_LIST,
        QUERY_KEY.ORG.GET_DEPARTMENT_STATUS_COUNTS,
        QUERY_KEY.ORG.GET_DEPARTMENT_DETAIL,
        QUERY_KEY.ORG.GET_DEPARTMENT_OPTIONS
      ].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    )
}
