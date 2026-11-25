import { axiosClient } from '~/configs/axios.config'
import { API_ATTENDANCE } from '~/shared/constants/api.constant'
import type { EOrgStatus } from '~/shared/enums/org.enum'
import type {
  IAttendancePolicy,
  IAttendancePolicyListParams,
  IAttendancePolicyPayload,
  IAttendancePolicySummary,
  IShift,
  IShiftListParams,
  IShiftPayload,
  IShiftSummary
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
