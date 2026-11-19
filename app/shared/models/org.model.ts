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

// Spec: employee-service DepartmentDtos

export interface IOrgStatusCounts {
  all?: number
  active?: number
  inactive?: number
}

/** DepartmentDto — designationCount / employeeCount are filled only by GET /org/departments/{id} */
export interface IDepartment {
  id?: string
  companyId?: string
  name?: string
  description?: string | null
  branch?: { id?: string; name?: string | null } | null
  status?: EOrgStatus
  createdDate?: string
  updatedDate?: string | null
  designationCount?: number | null
  employeeCount?: number | null
}

export interface IDepartmentListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  branchId?: string
  status?: EOrgStatus
}

/** DepartmentForm — full replacement on update (omitted description = cleared, omitted status = unchanged) */
export interface IDepartmentPayload {
  name: string
  branchId: number
  description?: string
  status?: EOrgStatus
}

// Spec: employee-service DesignationDtos

/** DesignationDto — its department and that department's branch; employeeCount only from GET /org/designations/{id} */
export interface IDesignation {
  id?: string
  companyId?: string
  name?: string
  description?: string | null
  department?: { id?: string; name?: string | null } | null
  branch?: { id?: string; name?: string | null } | null
  status?: EOrgStatus
  createdDate?: string
  updatedDate?: string | null
  employeeCount?: number | null
}

export interface IDesignationListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  departmentId?: string
  status?: EOrgStatus
}

/** DesignationForm — full replacement on update (omitted description = cleared, omitted status = unchanged) */
export interface IDesignationPayload {
  name: string
  departmentId: number
  description?: string
  status?: EOrgStatus
}

// Spec: employee-service AwardTypeDtos

/** AwardTypeDto — icon = key of the FE icon set (null = default icon) */
export interface IAwardType {
  id?: string
  companyId?: string
  name?: string
  description?: string | null
  icon?: string | null
  status?: EOrgStatus
  createdDate?: string
  updatedDate?: string | null
}

export interface IAwardTypeListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  status?: EOrgStatus
}

/** AwardTypeForm — full replacement on update (omitted description / icon = cleared, omitted status = unchanged) */
export interface IAwardTypePayload {
  name: string
  description?: string
  icon?: string
  status?: EOrgStatus
}

// Spec: employee-service DocumentTypeDtos (the DTO itself is IDocumentType in employee.model)

export interface IDocumentTypeListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  /** true = Required, false = Optional, omitted = all */
  required?: boolean
}

/** DocumentTypeForm — full replacement on update (omitted description = cleared) */
export interface IDocumentTypePayload {
  name: string
  description?: string
  required: boolean
}
