import { axiosClient } from '~/configs/axios.config'
import { API_EMAIL_TEMPLATE } from '~/shared/constants/api.constant'
import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'
import type {
  IEmailTemplate,
  IEmailTemplateContentPayload,
  IEmailTemplateDetail,
  IEmailTemplateListParams,
  IEmailTemplatePreview
} from '~/shared/models/email-template.model'

export const EmailTemplateService = {
  GetList: async (params?: IEmailTemplateListParams): Promise<IApiResponse<IApiPagination<IEmailTemplate>>> =>
    await axiosClient.get(API_EMAIL_TEMPLATE.LIST_URL, { params }),
  GetDetail: async (id: string): Promise<IApiResponse<IEmailTemplateDetail>> =>
    await axiosClient.get(API_EMAIL_TEMPLATE.DETAIL_URL(id)),
  SaveFromName: async (id: string, fromName: string): Promise<IApiResponse<IEmailTemplateDetail>> =>
    await axiosClient.put(API_EMAIL_TEMPLATE.SETTINGS_URL(id), { fromName }),
  SaveContent: async (
    id: string,
    lang: string,
    payload: IEmailTemplateContentPayload
  ): Promise<IApiResponse<IEmailTemplateDetail>> =>
    await axiosClient.put(API_EMAIL_TEMPLATE.CONTENT_URL(id, lang), payload),
  Preview: async (id: string, lang: string): Promise<IApiResponse<IEmailTemplatePreview>> =>
    await axiosClient.get(API_EMAIL_TEMPLATE.PREVIEW_URL(id, lang))
}
