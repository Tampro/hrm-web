import { useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { BranchService } from '~/services/org.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

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
