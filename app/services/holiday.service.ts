import { axiosClient } from '~/configs/axios.config'
import { API_HOLIDAY } from '~/shared/constants/api.constant'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  IHoliday,
  IHolidayCalendarParams,
  IHolidayCategory,
  IHolidayCategoryPayload,
  IHolidayListParams,
  IHolidayPayload
} from '~/shared/models/holiday.model'

export const HolidayService = {
  GetList: async (params?: IHolidayListParams): Promise<IApiResponse<IApiPagination<IHoliday>>> =>
    await axiosClient.get(API_HOLIDAY.LIST_URL, { params }),
  /** Spec: holidays overlapping [from, to], not paged, range ≤ 400 days */
  GetCalendar: async (params: IHolidayCalendarParams): Promise<IApiResponse<IHoliday[]>> =>
    await axiosClient.get(API_HOLIDAY.CALENDAR_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IHoliday>> => await axiosClient.get(API_HOLIDAY.DETAIL_URL(id)),
  Create: async (companyId: string | undefined, payload: IHolidayPayload): Promise<IApiResponse<IHoliday>> =>
    await axiosClient.post(API_HOLIDAY.LIST_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IHolidayPayload): Promise<IApiResponse<IHoliday>> =>
    await axiosClient.put(API_HOLIDAY.DETAIL_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_HOLIDAY.DETAIL_URL(id)),
  /** Files come back as raw bytes: axiosClient unwraps response.data, which is the Blob */
  ExportPdf: async (params?: IHolidayListParams): Promise<Blob> =>
    await axiosClient.get(API_HOLIDAY.EXPORT_PDF_URL, { params, responseType: 'blob' }),
  ExportIcal: async (params?: IHolidayListParams): Promise<Blob> =>
    await axiosClient.get(API_HOLIDAY.EXPORT_ICAL_URL, { params, responseType: 'blob' }),
  GetCategories: async (companyId?: string): Promise<IApiResponse<IHolidayCategory[]>> =>
    await axiosClient.get(API_HOLIDAY.CATEGORIES_URL, { params: { companyId } }),
  CreateCategory: async (
    companyId: string | undefined,
    payload: IHolidayCategoryPayload
  ): Promise<IApiResponse<IHolidayCategory>> =>
    await axiosClient.post(API_HOLIDAY.CATEGORIES_URL, payload, { params: { companyId } }),
  UpdateCategory: async (id: string, payload: IHolidayCategoryPayload): Promise<IApiResponse<IHolidayCategory>> =>
    await axiosClient.put(API_HOLIDAY.CATEGORY_URL(id), payload),
  DeleteCategory: async (id: string): Promise<IApiResponse<void>> =>
    await axiosClient.delete(API_HOLIDAY.CATEGORY_URL(id))
}
