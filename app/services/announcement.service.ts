import { axiosClient } from '~/configs/axios.config'
import { API_ANNOUNCEMENT } from '~/shared/constants/api.constant'
import type {
  IAnnouncement,
  IAnnouncementCategory,
  IAnnouncementCategoryPayload,
  IAnnouncementListParams,
  IAnnouncementPayload,
  IAnnouncementTabCounts
} from '~/shared/models/announcement.model'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'

// Spec: employee-service AnnouncementController (ANNOUNCEMENT_VIEW to read, ANNOUNCEMENT_MANAGE to write)
export const AnnouncementService = {
  GetList: async (params?: IAnnouncementListParams): Promise<IApiResponse<IApiPagination<IAnnouncement>>> =>
    await axiosClient.get(API_ANNOUNCEMENT.LIST_URL, { params }),
  GetTabCounts: async (params?: IAnnouncementListParams): Promise<IApiResponse<IAnnouncementTabCounts>> =>
    await axiosClient.get(API_ANNOUNCEMENT.TAB_COUNTS_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IAnnouncement>> =>
    await axiosClient.get(API_ANNOUNCEMENT.DETAIL_URL(id)),
  GetStatistics: async (id: string): Promise<IApiResponse<IAnnouncement>> =>
    await axiosClient.get(API_ANNOUNCEMENT.STATISTICS_URL(id)),
  Create: async (companyId: string | undefined, payload: IAnnouncementPayload): Promise<IApiResponse<IAnnouncement>> =>
    await axiosClient.post(API_ANNOUNCEMENT.LIST_URL, payload, { params: { companyId } }),
  Update: async (id: string, payload: IAnnouncementPayload): Promise<IApiResponse<IAnnouncement>> =>
    await axiosClient.put(API_ANNOUNCEMENT.DETAIL_URL(id), payload),
  Delete: async (id: string): Promise<IApiResponse<void>> => await axiosClient.delete(API_ANNOUNCEMENT.DETAIL_URL(id)),
  GetCategories: async (companyId?: string): Promise<IApiResponse<IAnnouncementCategory[]>> =>
    await axiosClient.get(API_ANNOUNCEMENT.CATEGORIES_URL, { params: { companyId } }),
  CreateCategory: async (
    companyId: string | undefined,
    payload: IAnnouncementCategoryPayload
  ): Promise<IApiResponse<IAnnouncementCategory>> =>
    await axiosClient.post(API_ANNOUNCEMENT.CATEGORIES_URL, payload, { params: { companyId } }),
  UpdateCategory: async (
    id: string,
    payload: IAnnouncementCategoryPayload
  ): Promise<IApiResponse<IAnnouncementCategory>> => await axiosClient.put(API_ANNOUNCEMENT.CATEGORY_URL(id), payload),
  DeleteCategory: async (id: string): Promise<IApiResponse<void>> =>
    await axiosClient.delete(API_ANNOUNCEMENT.CATEGORY_URL(id))
}
