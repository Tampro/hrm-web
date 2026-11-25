import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createListApiHook } from '~/hooks/use-query-api'
import {
  AttendancePolicyService,
  AttendanceRecordService,
  ShiftService,
  TimesheetService
} from '~/services/attendance.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type {
  IAttendanceCalendarParams,
  ITimesheetWeekParams,
  IAttendancePolicyListParams,
  IShiftListParams
} from '~/shared/models/attendance.model'

export const useGetListShiftApi = createListApiHook(QUERY_KEY.ATTENDANCE.GET_SHIFT_LIST, ShiftService.GetList)

export const useShiftCountsApi = (params: IShiftListParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_SHIFT_COUNTS, params],
    queryFn: () => ShiftService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

export const useShiftSummaryApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_SHIFT_SUMMARY, companyId],
    queryFn: () => ShiftService.GetSummary({ companyId }),
    select: (res) => res?.data,
    enabled
  })

export const useGetListAttendancePolicyApi = createListApiHook(
  QUERY_KEY.ATTENDANCE.GET_POLICY_LIST,
  AttendancePolicyService.GetList
)

export const useAttendancePolicyCountsApi = (params: IAttendancePolicyListParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_POLICY_COUNTS, params],
    queryFn: () => AttendancePolicyService.GetStatusCounts(params),
    select: (res) => res?.data,
    enabled
  })

export const useAttendancePolicySummaryApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_POLICY_SUMMARY, companyId],
    queryFn: () => AttendancePolicyService.GetSummary({ companyId }),
    select: (res) => res?.data,
    enabled
  })

/** Every attendance read is stale after a write (lists, tabs, summary cards) */
export const useInvalidateAttendance = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(Object.values(QUERY_KEY.ATTENDANCE).map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}

export const useAttendanceCalendarApi = (params: IAttendanceCalendarParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_CALENDAR, params],
    queryFn: () => AttendanceRecordService.GetCalendar(params),
    select: (res) => res?.data,
    placeholderData: (prev) => prev,
    enabled
  })

export const useTimesheetWeekApi = (params: ITimesheetWeekParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_TIMESHEET_WEEK, params],
    queryFn: () => TimesheetService.GetWeek(params),
    select: (res) => res?.data,
    placeholderData: (prev) => prev,
    enabled
  })

export const useTimesheetDayApi = (params: { employeeId?: string; date?: string }) =>
  useQuery({
    queryKey: [QUERY_KEY.ATTENDANCE.GET_TIMESHEET_DAY, params],
    queryFn: () => TimesheetService.GetDay({ employeeId: params.employeeId ?? '', date: params.date ?? '' }),
    select: (res) => res?.data ?? [],
    enabled: !!params.employeeId && !!params.date
  })
