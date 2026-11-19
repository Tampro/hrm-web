import type { IBaseFilterPanel, IBasePagination } from './common.model'

// Spec: employee-service HolidayDtos. Every field optional: the backend may return null.

/** CategoryDto — system = shared by every company, read-only; color = calendar legend colour #RRGGBB */
export interface IHolidayCategory {
  id?: string
  name?: string
  color?: string
  system?: boolean
}

/** HolidayDto — allBranches = no branch chosen: applies to every branch, also ones created later */
export interface IHoliday {
  id?: string
  companyId?: string
  name?: string
  category?: IHolidayCategory | null
  startDate?: string
  endDate?: string
  days?: number
  description?: string | null
  allBranches?: boolean
  branches?: { id?: string; name?: string }[]
  createdDate?: string
  updatedDate?: string | null
}

/** Filter shared by the list and the exports */
export interface IHolidayListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  categoryId?: string
  year?: number
  dateFrom?: string
  dateTo?: string
  branchId?: string
}

export interface IHolidayCalendarParams {
  companyId?: string
  from: string
  to: string
  branchId?: string
}

/** HolidayForm — full replacement on update: omitted description cleared, omitted branchIds = all branches */
export interface IHolidayPayload {
  name: string
  categoryId: number
  startDate: string
  endDate: string
  description?: string
  branchIds?: number[]
}

export interface IHolidayCategoryPayload {
  name: string
  color: string
}
