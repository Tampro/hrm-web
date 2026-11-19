import type { EEmployeeStatus, EEmploymentType, EGender } from '~/shared/enums/employee.enum'

import type { IBaseFilterPanel, IBasePagination } from './common.model'

// Spec: employee-service EmployeeDtos. Every field optional: the backend may return null.

export interface IRef {
  id?: string
  name?: string
}

/** EmployeeListItem; loginEnabled false = no account or the account is locked */
export interface IEmployee {
  id?: string
  employeeNo?: string
  employeeCode?: string | null
  fullName?: string
  email?: string
  profileImageUrl?: string | null
  branch?: IRef | null
  department?: IRef | null
  designation?: IRef | null
  status?: EEmployeeStatus
  employmentType?: EEmploymentType
  dateOfJoining?: string | null
  loginEnabled?: boolean
}

export interface IEmployeeStatusCounts {
  all?: number
  active?: number
  inactive?: number
  probation?: number
  terminated?: number
}

/** BankingDto — null for callers without EMPLOYEE_BANKING_VIEW */
export interface IEmployeeBanking {
  bankName?: string | null
  accountHolderName?: string | null
  accountNumber?: string | null
  bankIdentifierCode?: string | null
  bankBranch?: string | null
  taxPayerId?: string | null
  baseSalary?: number | null
}

/** DocumentDto — viewUrl / downloadUrl are time-limited links */
export interface IEmployeeDocument {
  id?: string
  documentType?: IRef | null
  fileId?: string
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  viewUrl?: string | null
  downloadUrl?: string | null
  expiryDate?: string | null
  expired?: boolean
  verified?: boolean
  verifiedAt?: string | null
}

export interface IEmployeeDetail {
  id?: string
  companyId?: string
  employeeNo?: string
  employeeCode?: string | null
  fullName?: string
  email?: string
  phone?: string | null
  dateOfBirth?: string | null
  gender?: EGender | null
  profileImageId?: string | null
  profileImageUrl?: string | null
  branch?: IRef | null
  department?: IRef | null
  designation?: IRef | null
  dateOfJoining?: string | null
  employmentType?: EEmploymentType
  status?: EEmployeeStatus
  shiftId?: string | null
  attendancePolicyId?: string | null
  reportsTo?: IRef | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  emergencyName?: string | null
  emergencyRelationship?: string | null
  emergencyPhone?: string | null
  banking?: IEmployeeBanking | null
  userId?: string | null
  loginEnabled?: boolean
  documents?: IEmployeeDocument[]
  createdDate?: string
  updatedDate?: string | null
}

export interface IEmployeeListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  branchId?: string
  departmentId?: string
  designationId?: string
  status?: EEmployeeStatus
}

export interface IEmployeeBankingPayload {
  bankName?: string
  accountHolderName?: string
  accountNumber?: string
  bankIdentifierCode?: string
  bankBranch?: string
  taxPayerId?: string
  baseSalary?: number
}

/** ProfileForm — full replacement on update: an omitted field is cleared */
export interface IEmployeeProfilePayload {
  fullName: string
  employeeCode?: string
  phone?: string
  dateOfBirth?: string
  gender?: EGender
  profileImageId?: number
  branchId?: number
  departmentId?: number
  designationId?: number
  dateOfJoining: string
  employmentType: EEmploymentType
  status: EEmployeeStatus
  /** not edited by the wizard: sent back unchanged (full replacement) */
  shiftId?: number
  attendancePolicyId?: number
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  emergencyName?: string
  emergencyRelationship?: string
  emergencyPhone?: string
  banking?: IEmployeeBankingPayload
  reportsToId?: number
}

export interface IEmployeeDocumentPayload {
  documentTypeId: number
  fileId: number
  expiryDate?: string
}

export interface IEmployeeCreatePayload {
  email: string
  password?: string
  profile: IEmployeeProfilePayload
  documents?: IEmployeeDocumentPayload[]
}

export interface IEmployeePasswordPayload {
  newPassword: string
  confirmPassword: string
}

/** ImportResult — refused rows are listed, the others are created */
export interface IEmployeeImportResult {
  total?: number
  created?: number
  errors?: { row?: number; code?: string; message?: string }[]
}

/** ChartNode — children = direct reports; active = green dot (ACTIVE, PROBATION) */
export interface IOrgChartNode {
  id?: string
  fullName?: string
  designation?: string | null
  profileImageUrl?: string | null
  active?: boolean
  children?: IOrgChartNode[]
}

export interface IOrgChart {
  companyName?: string
  members?: number
  children?: IOrgChartNode[]
}

// Spec: org dropdown options (active items only)
export interface IBranchOption {
  id?: string
  name?: string
}

export interface IDepartmentOption {
  id?: string
  name?: string
  branchId?: string
}

export interface IDesignationOption {
  id?: string
  name?: string
  departmentId?: string
}

/**
 * DocumentTypeDto — system = shared by every company (name / description read-only, Required set per company);
 * required = for the caller's company (tracked, never blocks adding an employee)
 */
export interface IDocumentType {
  id?: string
  name?: string
  description?: string | null
  required?: boolean
  system?: boolean
  /** shown as an empty slot on the Documents step by default */
  defaultSlot?: boolean
  createdDate?: string
  updatedDate?: string | null
}

// Spec: media-service MediaFileDto (fields the FE uses)
export interface IMediaFile {
  id?: string
  originalName?: string
  mimeType?: string
  sizeBytes?: number
  viewUrl?: string | null
}
