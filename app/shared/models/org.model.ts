import type { EOrgStatus } from '~/shared/enums/org.enum'

import type { IBaseFilterPanel, IBasePagination } from './common.model'

// Spec: employee-service BranchDtos. Every field optional: the backend may return null.

/** BranchDto — departmentCount / employeeCount are filled only by GET /org/branches/{id} */
export interface IBranch {
  id?: string
  companyId?: string
  name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  phone?: string | null
  email?: string | null
  status?: EOrgStatus
  createdDate?: string
  updatedDate?: string | null
  departmentCount?: number | null
  employeeCount?: number | null
}

export interface IBranchListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  status?: EOrgStatus
}

/** BranchForm — full replacement on update: an omitted optional field is cleared */
export interface IBranchPayload {
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  phone?: string
  email?: string
  status?: EOrgStatus
}
