import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { cookieHelper } from '~/helpers/cookie.helper'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { AuthService } from '~/services/auth.service'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { ILoginPayload } from '~/shared/models/auth.model'

export const useLogin = () => {
  const navigate = useNavigate()
  return useMutationApi({
    mutationFn: (payload: ILoginPayload) => AuthService.Login(payload),
    onSuccess: (res) => {
      cookieHelper.setTokens(res?.data)
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  })
}

export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutationApi({
    mutationFn: async () => {
      const refreshToken = cookieHelper.getRefreshToken()
      if (refreshToken) await AuthService.Logout({ refreshToken }).catch(() => undefined)
    },
    onSettled: () => {
      cookieHelper.clearTokens()
      queryClient.clear()
      navigate(ROUTES.LOGIN, { replace: true })
    }
  })
}
