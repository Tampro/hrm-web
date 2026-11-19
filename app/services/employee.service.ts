import { axiosClient } from '~/configs/axios.config'
import { API_EMPLOYEE, API_MEDIA, API_ORG } from '~/shared/constants/api.constant'
import type { EEmployeeStatus, ELetterType } from '~/shared/enums/employee.enum'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  IBranchOption,
  IDepartmentOption,
  IDesignationOption,
  IDocumentType,
  IEmployee,
  IEmployeeCreatePayload,
  IEmployeeDetail,
  IEmployeeDocument,
  IEmployeeDocumentPayload,
  IEmployeeImportResult,
  IEmployeeListParams,
  IEmployeePasswordPayload,
  IEmployeeProfilePayload,
  IEmployeeStatusCounts,
  IMediaFile,
  IOrgChart
} from '~/shared/models/employee.model'

/** companyId is only sent by a super admin; company users act on the company of their token */
type TCompanyParams = { companyId?: string }

/** Files come back as raw bytes: axiosClient unwraps response.data, which is the Blob */
const getBlob = async (url: string, params?: object): Promise<Blob> =>
  await axiosClient.get(url, { params, responseType: 'blob' })

export const EmployeeService = {
  GetList: async (params?: IEmployeeListParams): Promise<IApiResponse<IApiPagination<IEmployee>>> =>
    await axiosClient.get(API_EMPLOYEE.LIST_URL, { params }),
  GetStatusCounts: async (params?: IEmployeeListParams): Promise<IApiResponse<IEmployeeStatusCounts>> =>
    await axiosClient.get(API_EMPLOYEE.STATUS_COUNTS_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IEmployeeDetail>> =>
    await axiosClient.get(API_EMPLOYEE.DETAIL_URL(id)),
  Create: async (
    companyId: string | undefined,
    payload: IEmployeeCreatePayload
  ): Promise<IApiResponse<IEmployeeDetail>> =>
    await axiosClient.post(API_EMPLOYEE.LIST_URL, payload, { params: { companyId } }),
  Update: async (id: string, profile: IEmployeeProfilePayload): Promise<IApiResponse<IEmployeeDetail>> =>
    await axiosClient.put(API_EMPLOYEE.DETAIL_URL(id), profile),
  UpdateStatus: async (id: string, status: EEmployeeStatus): Promise<IApiResponse<IEmployeeDetail>> =>
    await axiosClient.put(API_EMPLOYEE.STATUS_URL(id), { status }),
  UpdateLogin: async (id: string, enabled: boolean): Promise<IApiResponse<IEmployeeDetail>> =>
    await axiosClient.put(API_EMPLOYEE.LOGIN_URL(id), { enabled }),
  SetPassword: async (id: string, payload: IEmployeePasswordPayload): Promise<IApiResponse<void>> =>
    await axiosClient.put(API_EMPLOYEE.PASSWORD_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_EMPLOYEE.DETAIL_URL(id)),
  AddDocument: async (id: string, payload: IEmployeeDocumentPayload): Promise<IApiResponse<IEmployeeDocument>> =>
    await axiosClient.post(API_EMPLOYEE.DOCUMENTS_URL(id), payload),
  VerifyDocument: async (id: string, documentId: string, verified: boolean): Promise<IApiResponse<IEmployeeDocument>> =>
    await axiosClient.put(API_EMPLOYEE.DOCUMENT_VERIFY_URL(id, documentId), { verified }),
  DeleteDocument: async (id: string, documentId: string): Promise<IApiResponse<void>> =>
    await axiosClient.delete(API_EMPLOYEE.DOCUMENT_URL(id, documentId)),
  GetOrgChart: async (params?: TCompanyParams): Promise<IApiResponse<IOrgChart>> =>
    await axiosClient.get(API_EMPLOYEE.ORG_CHART_URL, { params }),
  Export: async (params?: IEmployeeListParams): Promise<Blob> => await getBlob(API_EMPLOYEE.EXPORT_URL, params),
  GetImportTemplate: async (): Promise<Blob> => await getBlob(API_EMPLOYEE.IMPORT_TEMPLATE_URL),
  Import: async (companyId: string | undefined, file: File): Promise<IApiResponse<IEmployeeImportResult>> => {
    const body = new FormData()
    body.append('file', file)
    return await axiosClient.post(API_EMPLOYEE.IMPORT_URL, body, { params: { companyId } })
  },
  GetLetter: async (id: string, type: ELetterType, lang: string): Promise<Blob> =>
    await getBlob(API_EMPLOYEE.LETTER_URL(id, type), { lang })
}

export const OrgService = {
  GetBranchOptions: async (params?: TCompanyParams): Promise<IApiResponse<IBranchOption[]>> =>
    await axiosClient.get(API_ORG.BRANCH_OPTIONS_URL, { params }),
  GetDepartmentOptions: async (
    params?: TCompanyParams & { branchId?: string }
  ): Promise<IApiResponse<IDepartmentOption[]>> => await axiosClient.get(API_ORG.DEPARTMENT_OPTIONS_URL, { params }),
  GetDesignationOptions: async (
    params?: TCompanyParams & { departmentId?: string }
  ): Promise<IApiResponse<IDesignationOption[]>> => await axiosClient.get(API_ORG.DESIGNATION_OPTIONS_URL, { params }),
  GetDocumentTypes: async (params?: TCompanyParams): Promise<IApiResponse<IDocumentType[]>> =>
    await axiosClient.get(API_ORG.DOCUMENT_TYPES_URL, { params })
}

export const MediaService = {
  /** Spec: one multipart field `files`; super admin uploads into the company with companyId */
  Upload: async (companyId: string | undefined, file: File): Promise<IApiResponse<IMediaFile[]>> => {
    const body = new FormData()
    body.append('files', file)
    return await axiosClient.post(API_MEDIA.FILES_URL, body, { params: { companyId } })
  }
}
