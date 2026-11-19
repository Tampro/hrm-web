import { axiosClient } from '~/configs/axios.config'
import { API_ORG } from '~/shared/constants/api.constant'
import type { EOrgStatus } from '~/shared/enums/org.enum'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  IAwardType,
  IAwardTypeListParams,
  IAwardTypePayload,
  IBranch,
  IBranchListParams,
  IBranchPayload,
  IDepartment,
  IDepartmentListParams,
  IDepartmentPayload,
  IDesignation,
  IDesignationListParams,
  IDesignationPayload,
  IOrgStatusCounts
} from '~/shared/models/org.model'

// Spec: employee-service BranchController (ORG_VIEW to read, ORG_MANAGE to write; super admin passes companyId)
export const BranchService = {
  GetList: async (params?: IBranchListParams): Promise<IApiResponse<IApiPagination<IBranch>>> =>
    await axiosClient.get(API_ORG.BRANCHES_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IBranch>> => await axiosClient.get(API_ORG.BRANCH_URL(id)),
  Create: async (companyId: string | undefined, payload: IBranchPayload): Promise<IApiResponse<IBranch>> =>
    await axiosClient.post(API_ORG.BRANCHES_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IBranchPayload): Promise<IApiResponse<IBranch>> =>
    await axiosClient.put(API_ORG.BRANCH_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IBranch>> =>
    await axiosClient.put(API_ORG.BRANCH_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ORG.BRANCH_URL(id))
}

// Spec: employee-service DepartmentController (ORG_VIEW to read, ORG_MANAGE to write; super admin passes companyId)
export const DepartmentService = {
  GetList: async (params?: IDepartmentListParams): Promise<IApiResponse<IApiPagination<IDepartment>>> =>
    await axiosClient.get(API_ORG.DEPARTMENTS_URL, { params }),
  GetStatusCounts: async (params?: IDepartmentListParams): Promise<IApiResponse<IOrgStatusCounts>> =>
    await axiosClient.get(API_ORG.DEPARTMENT_STATUS_COUNTS_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IDepartment>> =>
    await axiosClient.get(API_ORG.DEPARTMENT_URL(id)),
  Create: async (companyId: string | undefined, payload: IDepartmentPayload): Promise<IApiResponse<IDepartment>> =>
    await axiosClient.post(API_ORG.DEPARTMENTS_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IDepartmentPayload): Promise<IApiResponse<IDepartment>> =>
    await axiosClient.put(API_ORG.DEPARTMENT_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IDepartment>> =>
    await axiosClient.put(API_ORG.DEPARTMENT_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ORG.DEPARTMENT_URL(id))
}

// Spec: employee-service DesignationController (ORG_VIEW to read, ORG_MANAGE to write; super admin passes companyId)
export const DesignationService = {
  GetList: async (params?: IDesignationListParams): Promise<IApiResponse<IApiPagination<IDesignation>>> =>
    await axiosClient.get(API_ORG.DESIGNATIONS_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IDesignation>> =>
    await axiosClient.get(API_ORG.DESIGNATION_URL(id)),
  Create: async (companyId: string | undefined, payload: IDesignationPayload): Promise<IApiResponse<IDesignation>> =>
    await axiosClient.post(API_ORG.DESIGNATIONS_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IDesignationPayload): Promise<IApiResponse<IDesignation>> =>
    await axiosClient.put(API_ORG.DESIGNATION_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IDesignation>> =>
    await axiosClient.put(API_ORG.DESIGNATION_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ORG.DESIGNATION_URL(id))
}

// Spec: employee-service AwardTypeController (ORG_VIEW to read, ORG_MANAGE to write; super admin passes companyId)
export const AwardTypeService = {
  GetList: async (params?: IAwardTypeListParams): Promise<IApiResponse<IApiPagination<IAwardType>>> =>
    await axiosClient.get(API_ORG.AWARD_TYPES_URL, { params }),
  Create: async (companyId: string | undefined, payload: IAwardTypePayload): Promise<IApiResponse<IAwardType>> =>
    await axiosClient.post(API_ORG.AWARD_TYPES_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IAwardTypePayload): Promise<IApiResponse<IAwardType>> =>
    await axiosClient.put(API_ORG.AWARD_TYPE_URL(id), payload),
  UpdateStatus: async (id: string, status: EOrgStatus): Promise<IApiResponse<IAwardType>> =>
    await axiosClient.put(API_ORG.AWARD_TYPE_STATUS_URL(id), { status }),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ORG.AWARD_TYPE_URL(id))
}
