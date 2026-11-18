import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import i18next from 'i18next'
import { toast } from 'sonner'

import { cookieHelper } from '~/helpers/cookie.helper'
import { API_AUTH } from '~/shared/constants/api.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { IApiResponse } from '~/shared/models/common.model'
import type { IToken } from '~/shared/models/auth.model'

type TRetryConfig = InternalAxiosRequestConfig

const baseURL = import.meta.env.VITE_BASE_URL_API || '/api/v1'

// Auth endpoints answer 401 for wrong credentials / expired refresh token: never try to refresh for them
const NO_REFRESH_URLS: string[] = [API_AUTH.LOGIN_URL, API_AUTH.REFRESH_TOKEN_URL, API_AUTH.LOGOUT_URL]

const withLanguage = (config: InternalAxiosRequestConfig) => {
  config.headers['Accept-Language'] = i18next.language || 'vi'
  return config
}

const unwrap = (response: AxiosResponse) => response.data

const toastError = (error: AxiosError<IApiResponse<unknown>>) => {
  if ((error.config as TRetryConfig | undefined)?._silent) return
  // The backend already localises `message` from Accept-Language
  toast.error(error.response?.data?.message || i18next.t('common.error_network'))
}

export const publicAxiosClient = axios.create({ baseURL })
publicAxiosClient.interceptors.request.use(withLanguage)
publicAxiosClient.interceptors.response.use(unwrap, (error: AxiosError<IApiResponse<unknown>>) => {
  toastError(error)
  return Promise.reject(error)
})

export const axiosClient = axios.create({ baseURL })

axiosClient.interceptors.request.use((config) => {
  const token = cookieHelper.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return withLanguage(config)
})

// One refresh at a time; concurrent 401s wait for the same promise
let refreshPromise: Promise<string | undefined> | null = null

const refreshAccessToken = async () => {
  const refreshToken = cookieHelper.getRefreshToken()
  if (!refreshToken) return undefined
  const res: IApiResponse<IToken> = await axios
    .post(
      `${baseURL}${API_AUTH.REFRESH_TOKEN_URL}`,
      { refreshToken },
      { headers: { 'Accept-Language': i18next.language || 'vi' } }
    )
    .then(unwrap)
  cookieHelper.setTokens(res?.data)
  return res?.data?.accessToken
}

const goToLogin = () => {
  cookieHelper.clearTokens()
  if (window.location.pathname !== ROUTES.LOGIN) window.location.assign(ROUTES.LOGIN)
}

axiosClient.interceptors.response.use(unwrap, async (error: AxiosError<IApiResponse<unknown>>) => {
  const config = error.config as TRetryConfig | undefined
  const isNoRefresh = NO_REFRESH_URLS.some((url) => config?.url?.endsWith(url))

  if (error.response?.status === 401 && config && !config._retry && !isNoRefresh) {
    config._retry = true
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (!newToken) throw error
      config.headers.Authorization = `Bearer ${newToken}`
      return axiosClient(config)
    } catch {
      goToLogin()
      return Promise.reject(error)
    }
  }

  toastError(error)
  return Promise.reject(error)
})
