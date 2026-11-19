import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { EmployeeService, OrgService } from '~/services/employee.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { IEmployeeListParams } from '~/shared/models/employee.model'

export const useGetListEmployeeApi = createListApiHook(QUERY_KEY.EMPLOYEE.GET_LIST, EmployeeService.GetList)

export const useGetEmployeeDetailApi = createDetailApiHook(QUERY_KEY.EMPLOYEE.GET_DETAIL, EmployeeService.GetDetail)

export const useGetEmployeeStatusCountsApi = (params: IEmployeeListParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.EMPLOYEE.GET_STATUS_COUNTS, params],
    queryFn: () => EmployeeService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

/** Every employee read is stale after a write (list, tabs, detail, chart, manager picker) */
export const useInvalidateEmployees = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(Object.values(QUERY_KEY.EMPLOYEE).map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}

// Org dropdowns (active items only). Departments need a branch, designations a department (Spec: EMP_023).
export const useBranchOptionsApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ORG.GET_BRANCH_OPTIONS, companyId],
    queryFn: () => OrgService.GetBranchOptions({ companyId }),
    select: (res) => res?.data ?? [],
    enabled
  })

export const useDepartmentOptionsApi = (companyId: string | undefined, branchId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ORG.GET_DEPARTMENT_OPTIONS, companyId, branchId],
    queryFn: () => OrgService.GetDepartmentOptions({ companyId, branchId }),
    select: (res) => res?.data ?? [],
    enabled: enabled && !!branchId
  })

export const useDesignationOptionsApi = (
  companyId: string | undefined,
  departmentId: string | undefined,
  enabled = true
) =>
  useQuery({
    queryKey: [QUERY_KEY.ORG.GET_DESIGNATION_OPTIONS, companyId, departmentId],
    queryFn: () => OrgService.GetDesignationOptions({ companyId, departmentId }),
    select: (res) => res?.data ?? [],
    enabled: enabled && !!departmentId
  })

export const useDocumentTypesApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ORG.GET_DOCUMENT_TYPES, companyId],
    queryFn: () => OrgService.GetDocumentTypes({ companyId }),
    select: (res) => res?.data ?? [],
    enabled
  })

/** "Reports to" picker: employees of the company (first 100, by name) */
export const useManagerOptionsApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.EMPLOYEE.GET_MANAGER_OPTIONS, companyId],
    queryFn: () => EmployeeService.GetList({ companyId, page: 0, size: 100, sort: 'fullName,asc' }),
    select: (res) => res?.data?.content ?? [],
    enabled
  })
