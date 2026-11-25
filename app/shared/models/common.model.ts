import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Spec: backend ApiMessageDto — the same envelope is used for success (result: true) and errors (result: false)
export interface IApiResponse<T> {
  result?: boolean
  code?: string
  data?: T
  message?: string
  traceId?: string
}

// Spec: backend ResponseListDto
export interface IApiPagination<T> {
  content?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}

// Spec: Spring pageable — page is zero-based on the backend
export interface IBasePagination {
  page?: number
  size?: number
  sort?: string
}

export interface IBaseFilterPanel {
  keyword?: string
}

export interface ITabOption<T extends string = string> {
  label: string
  value: T
  count?: number
  disabled?: boolean
}

/** Tabs that are separate routes */
export interface ITabItem {
  label: string
  route: string
  count?: number
}

export interface IInfoRow {
  label: string
  value: ReactNode
}

export interface ISidebarItem {
  label: string
  route: string
  icon: LucideIcon
  /** Shown only to super admins (Spec: MeDto.superAdmin) */
  superAdminOnly?: boolean
  /** Shown only when the user holds this permission (Spec: MeDto.permissions, MODULE_ACTION) */
  permission?: string
}

/** One entry of the attendance calendar legend */
export interface IAttendanceLegendItem {
  key: string
  label: string
  icon: LucideIcon
  className: string
}
