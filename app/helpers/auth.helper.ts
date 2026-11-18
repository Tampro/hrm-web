import { redirect } from 'react-router'

import { cookieHelper } from '~/helpers/cookie.helper'
import { ROUTES } from '~/shared/constants/routes.constant'

export type TProtectedRouteType = 'ROOT' | 'AUTH_ONLY' | 'PRIVATE'

// A refresh token alone counts as signed in: axios refreshes the access token on the first 401
const isAuthenticated = () => !!(cookieHelper.getToken() || cookieHelper.getRefreshToken())

export const authHelper = {
  isAuthenticated,
  handleProtectedRoute: (type: TProtectedRouteType) => {
    const authed = isAuthenticated()
    if (type === 'ROOT') throw redirect(authed ? ROUTES.DASHBOARD : ROUTES.LOGIN)
    if (type === 'AUTH_ONLY' && authed) throw redirect(ROUTES.DASHBOARD)
    if (type === 'PRIVATE' && !authed) throw redirect(ROUTES.LOGIN)
    return null
  }
}
