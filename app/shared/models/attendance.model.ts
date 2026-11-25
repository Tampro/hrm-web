import type { EApprovalStatus, EDayStatus } from '~/shared/enums/attendance.enum'
import type { EOrgStatus } from '~/shared/enums/org.enum'

import type { IBaseFilterPanel, IBasePagination } from './common.model'

// Spec: attendance-service ShiftDtos / AttendancePolicyDtos. Every field optional: the backend may return null.

/** ShiftDto — times are HH:mm[:ss]; workingMinutes = span (over midnight for a night shift) minus the break */
export interface IShift {
  id?: string
  companyId?: string
  name?: string
  description?: string | null
  startTime?: string
  endTime?: string
  breakDurationMinutes?: number
  breakStartTime?: string | null
  breakEndTime?: string | null
  gracePeriodMinutes?: number
  nightShift?: boolean
  workingMinutes?: number
  status?: EOrgStatus
  createdDate?: string
  updatedDate?: string | null
}

export interface IShiftSummary {
  total?: number
  active?: number
  night?: number
  day?: number
}

export interface IShiftListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  nightShift?: boolean
  status?: EOrgStatus
}

/** ShiftForm — full replacement on update (omitted description / break times cleared, omitted status unchanged) */
export interface IShiftPayload {
  name: string
  description?: string
  startTime: string
  endTime: string
  breakDurationMinutes: number
  breakStartTime?: string
  breakEndTime?: string
  gracePeriodMinutes: number
  nightShift: boolean
  status?: EOrgStatus
}

/** PolicyDto — overtimeRatePerHour in the company's currency */
export interface IAttendancePolicy {
  id?: string
  companyId?: string
  name?: string
  description?: string | null
  lateArrivalGraceMinutes?: number
  earlyDepartureGraceMinutes?: number
  halfDayThresholdHours?: number
  overtimeRatePerHour?: number
  status?: EOrgStatus
  createdDate?: string
  updatedDate?: string | null
}

export interface IAttendancePolicySummary {
  total?: number
  active?: number
  avgLateArrivalGraceMinutes?: number
  avgOvertimeRatePerHour?: number
}

export interface IAttendancePolicyListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  status?: EOrgStatus
}

/** PolicyForm — omitted grace minutes = 15, omitted half-day threshold = 4.00 */
export interface IAttendancePolicyPayload {
  name: string
  description?: string
  lateArrivalGraceMinutes: number
  earlyDepartureGraceMinutes: number
  halfDayThresholdHours: number
  overtimeRatePerHour: number
  status?: EOrgStatus
}

// Spec: attendance-service RecordDtos

/** RecordDto — clock times HH:mm[:ss]; hours are decimals */
export interface IAttendanceRecord {
  id?: string
  employeeId?: string
  date?: string
  clockIn?: string | null
  clockOut?: string | null
  status?: string
  late?: boolean
  earlyDeparture?: boolean
  holiday?: boolean
  weekend?: boolean
  totalHours?: number | null
  breakHours?: number | null
  overtimeHours?: number | null
  overtimeAmount?: number | null
  shiftId?: string | null
  attendancePolicyId?: string | null
  notes?: string | null
  createdDate?: string
  updatedDate?: string | null
}

/** RecordForm — full replacement on update: omitted clock times / notes are cleared */
export interface IAttendanceRecordPayload {
  employeeId: number
  date: string
  clockIn?: string
  clockOut?: string
  notes?: string
}

/** DayCell — recordId null when no record exists */
export interface IAttendanceDayCell {
  date?: string
  status?: EDayStatus
  weekend?: boolean
  late?: boolean
  earlyDeparture?: boolean
  overtime?: boolean
  clockIn?: string | null
  clockOut?: string | null
  notes?: string | null
  recordId?: string | null
}

/** EmployeeRow — attended = present days + half of the half days */
export interface IAttendanceEmployeeRow {
  employeeId?: string
  fullName?: string | null
  employeeCode?: string | null
  designation?: string | null
  profileImageUrl?: string | null
  days?: IAttendanceDayCell[]
  attended?: number | null
  workingDays?: number | null
}

export interface IAttendanceCalendar {
  year?: number
  month?: number
  today?: string
  weeklyOffDays?: string[]
  rows?: IAttendanceEmployeeRow[]
  page?: number
  size?: number
  totalElements?: number
}

export interface IAttendanceCalendarParams {
  companyId?: string
  year: number
  month: number
  employeeId?: string
  page?: number
  size?: number
}

export interface IAttendanceImportResult {
  total?: number
  created?: number
  updated?: number
  errors?: { row?: number; code?: string; message?: string }[]
}

// Spec: attendance-service TimesheetDtos

export interface ITimesheetEntry {
  id?: string
  employeeId?: string
  date?: string
  hours?: number | null
  project?: string | null
  description?: string | null
  status?: EApprovalStatus
  managerComments?: string | null
  decidedAt?: string | null
  createdDate?: string
  updatedDate?: string | null
}

export interface ITimesheetEntryPayload {
  employeeId: number
  date: string
  hours: number
  project?: string
  description: string
}

/** DayCell — status of the day: PENDING if any entry waits, else REJECTED if any, else APPROVED; null = no entry */
export interface ITimesheetDayCell {
  date?: string
  hours?: number | null
  entries?: number | null
  status?: EApprovalStatus | null
}

export interface ITimesheetWeekRow {
  employeeId?: string
  fullName?: string | null
  designation?: string | null
  profileImageUrl?: string | null
  days?: ITimesheetDayCell[] | null
  total?: number | null
}

export interface ITimesheetStatusCounts {
  all?: number
  pending?: number
  approved?: number
  rejected?: number
}

export interface ITimesheetWeek {
  weekStart?: string
  weekEnd?: string
  rows?: ITimesheetWeekRow[]
  counts?: ITimesheetStatusCounts
  page?: number
  size?: number
  totalElements?: number
}

export interface ITimesheetWeekParams {
  companyId?: string
  date: string
  employeeId?: string
  keyword?: string
  status?: EApprovalStatus
  page?: number
  size?: number
}

export interface ITimesheetExportParams {
  companyId?: string
  from: string
  to: string
  employeeId?: string
  status?: EApprovalStatus
}
