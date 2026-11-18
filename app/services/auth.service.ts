import { axiosClient, publicAxiosClient } from '~/configs/axios.config'
import { API_AUTH } from '~/shared/constants/api.constant'
import type { ILoginPayload, IMe, IRefreshTokenPayload, IToken } from '~/shared/models/auth.model'
import type { IApiResponse } from '~/shared/models/common.model'

export const AuthService = {
  Login: async (payload: ILoginPayload): Promise<IApiResponse<IToken>> =>
    await publicAxiosClient.post(API_AUTH.LOGIN_URL, payload),
  // Spec: always answers 200; issued access tokens stay valid until they expire. Silent: logout must not toast
  Logout: async (payload: IRefreshTokenPayload): Promise<IApiResponse<void>> =>
    await publicAxiosClient.post(API_AUTH.LOGOUT_URL, payload, { _silent: true }),
  GetMe: async (): Promise<IApiResponse<IMe>> => await axiosClient.get(API_AUTH.ME_URL)
}
