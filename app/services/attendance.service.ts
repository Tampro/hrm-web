import { axiosClient } from '~/configs/axios.config'
import { API_ATTENDANCE } from '~/shared/constants/api.constant'
import type { EOrgStatus } from '~/shared/enums/org.enum'
import type {
  IAttendanceCalendar,
  IAttendanceCalendarParams,
  IAttendanceImportResult,
  IAttendancePolicy,
  IAttendancePolicyListParams,
  IAttendancePolicyPayload,
  IAttendancePolicySummary,
  IAttendanceRecord,
  IAttendanceRecordPayload,
  IShift,
  IShiftListParams,
  IShiftPayload,
  IShiftSummary,
  ITimesheetEntry,
  ITimesheetEntryPayload,
  ITimesheetExportParams,
  ITimesheetWeek,
  ITimesheetWeekParams
} from '~/shared/models/attendance.model'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type { IOrgStatusCounts } from '~/shared/models/org.model'

type TCompanyParams = { companyId?: string }

// Spec: attendance-service ShiftController (ATTENDANCE_VIEW to read, ATTENDANCE_MANAGE to write)
export const ShiftService = {
  GetList: async (params?: IShiftListParams): Promise<IApiResponse<IApiPagination<IShift>>> =>
    await axiosClient.get(API_ATTENDANCE.SHIFTS_URL, { params }),
  GetStatusCounts: async (params?: IShiftListParams): Promise<IApiResponse<IOrgStatusCounts>> =>
    await axiosClient.get(API_ATTENDANCE.SHIFT_STATUS_COUNTS_URL, { params }),
  GetSummary: async (params?: TCompanyParams): Promise<IApiResponse<IShiftSummary>> =>
    await axiosClient.get(API_ATTENDANCE.SHIFT_SUMMARY_URL, { params }),
  Create: async (companyId: string | undefined, payload: IShiftPayload): Promise<IApiResponse<IShift>> =>
    await axiosClient.post(API_ATTENDANCE.SHIFTS_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IShiftPayload): Promise<IApiResponse<IShift>> =>
    await axiosClient.put(API_ATTENDANCE.SHIFT_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IShift>> =>
    await axiosClient.put(API_ATTENDANCE.SHIFT_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ATTENDANCE.SHIFT_URL(id))
}

// Spec: attendance-service AttendancePolicyController
export const AttendancePolicyService = {
  GetList: async (params?: IAttendancePolicyListParams): Promise<IApiResponse<IApiPagination<IAttendancePolicy>>> =>
    await axiosClient.get(API_ATTENDANCE.POLICIES_URL, { params }),
  GetStatusCounts: async (params?: IAttendancePolicyListParams): Promise<IApiResponse<IOrgStatusCounts>> =>
    await axiosClient.get(API_ATTENDANCE.POLICY_STATUS_COUNTS_URL, { params }),
  GetSummary: async (params?: TCompanyParams): Promise<IApiResponse<IAttendancePolicySummary>> =>
    await axiosClient.get(API_ATTENDANCE.POLICY_SUMMARY_URL, { params }),
  Create: async (
    companyId: string | undefined,
    payload: IAttendancePolicyPayload
  ): Promise<IApiResponse<IAttendancePolicy>> =>
    await axiosClient.post(API_ATTENDANCE.POLICIES_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IAttendancePolicyPayload): Promise<IApiResponse<IAttendancePolicy>> =>
    await axiosClient.put(API_ATTENDANCE.POLICY_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IAttendancePolicy>> =>
    await axiosClient.put(API_ATTENDANCE.POLICY_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ATTENDANCE.POLICY_URL(id))
}

// Spec: attendance-service AttendanceRecordController (calendar also needs EMPLOYEE_VIEW and ORG_VIEW)
export const AttendanceRecordService = {
  GetCalendar: async (params: IAttendanceCalendarParams): Promise<IApiResponse<IAttendanceCalendar>> =>
    await axiosClient.get(API_ATTENDANCE.RECORD_CALENDAR_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IAttendanceRecord>> =>
    await axiosClient.get(API_ATTENDANCE.RECORD_URL(id)),
  Create: async (payload: IAttendanceRecordPayload): Promise<IApiResponse<IAttendanceRecord>> =>
    await axiosClient.post(API_ATTENDANCE.RECORDS_URL, payload),
  Update: async (id: string, payload: IAttendanceRecordPayload): Promise<IApiResponse<IAttendanceRecord>> =>
    await axiosClient.put(API_ATTENDANCE.RECORD_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ATTENDANCE.RECORD_URL(id)),
  /** Files come back as raw bytes: axiosClient unwraps response.data, which is the Blob */
  Export: async (params: Omit<IAttendanceCalendarParams, 'page' | 'size'>): Promise<Blob> =>
    await axiosClient.get(API_ATTENDANCE.RECORD_EXPORT_URL, { params, responseType: 'blob' }),
  GetImportTemplate: async (): Promise<Blob> =>
    await axiosClient.get(API_ATTENDANCE.RECORD_IMPORT_TEMPLATE_URL, { responseType: 'blob' }),
  Import: async (companyId: string | undefined, file: File): Promise<IApiResponse<IAttendanceImportResult>> => {
    const body = new FormData()
    body.append('file', file)
    return await axiosClient.post(API_ATTENDANCE.RECORD_IMPORT_URL, body, { params: { companyId } })
  }
}

// Spec: attendance-service TimesheetController
export const TimesheetService = {
  GetWeek: async (params: ITimesheetWeekParams): Promise<IApiResponse<ITimesheetWeek>> =>
    await axiosClient.get(API_ATTENDANCE.TIMESHEET_WEEK_URL, { params }),
  GetDay: async (params: { employeeId: string; date: string }): Promise<IApiResponse<ITimesheetEntry[]>> =>
    await axiosClient.get(API_ATTENDANCE.TIMESHEET_ENTRIES_URL, { params }),
  Create: async (payload: ITimesheetEntryPayload): Promise<IApiResponse<ITimesheetEntry>> =>
    await axiosClient.post(API_ATTENDANCE.TIMESHEET_ENTRIES_URL, payload),
  Update: async (id: string, payload: ITimesheetEntryPayload): Promise<IApiResponse<ITimesheetEntry>> =>
    await axiosClient.put(API_ATTENDANCE.TIMESHEET_ENTRY_URL(id), payload),
  Approve: async (id: string): Promise<IApiResponse<ITimesheetEntry>> =>
    await axiosClient.put(API_ATTENDANCE.TIMESHEET_APPROVE_URL(id), {}),
  Reject: async (id: string): Promise<IApiResponse<ITimesheetEntry>> =>
    await axiosClient.put(API_ATTENDANCE.TIMESHEET_REJECT_URL(id), {}),
  Delete: async (id: string): Promise<IApiResponse<void>> =>
    await axiosClient.delete(API_ATTENDANCE.TIMESHEET_ENTRY_URL(id)),
  Export: async (params: ITimesheetExportParams): Promise<Blob> =>
    await axiosClient.get(API_ATTENDANCE.TIMESHEET_EXPORT_URL, { params, responseType: 'blob' }),
  GetImportTemplate: async (): Promise<Blob> =>
    await axiosClient.get(API_ATTENDANCE.TIMESHEET_IMPORT_TEMPLATE_URL, { responseType: 'blob' }),
  Import: async (companyId: string | undefined, file: File): Promise<IApiResponse<IAttendanceImportResult>> => {
    const body = new FormData()
    body.append('file', file)
    return await axiosClient.post(API_ATTENDANCE.TIMESHEET_IMPORT_URL, body, { params: { companyId } })
  }
}
