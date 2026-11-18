import { axiosClient } from '~/configs/axios.config'
import { API_SETTINGS } from '~/shared/constants/api.constant'
import { ESettingsSection } from '~/shared/enums/settings.enum'
import type { IApiResponse } from '~/shared/models/common.model'

/** Payment has one sub-section with an API so far: bank transfer */
const API_SECTION: Record<ESettingsSection, string> = {
  ...(Object.fromEntries(Object.values(ESettingsSection).map((s) => [s, s])) as Record<ESettingsSection, string>),
  [ESettingsSection.Payment]: 'payment/bank-transfer'
}

export const SettingsService = {
  GetSection: async <T>(section: ESettingsSection): Promise<IApiResponse<T>> =>
    await axiosClient.get(API_SETTINGS.ADMIN_SECTION_URL(API_SECTION[section])),
  UpdateSection: async <T>(section: ESettingsSection, payload: unknown): Promise<IApiResponse<T>> =>
    await axiosClient.put(API_SETTINGS.ADMIN_SECTION_URL(API_SECTION[section]), payload),
  SendTestEmail: async (to: string): Promise<IApiResponse<void>> =>
    await axiosClient.post(API_SETTINGS.ADMIN_EMAIL_TEST_URL, { to })
}
