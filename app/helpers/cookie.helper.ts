import Cookies from 'js-cookie'

import type { IToken } from '~/shared/models/auth.model'

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const SECONDS_PER_DAY = 24 * 60 * 60

const cookieOptions = (seconds?: number): Cookies.CookieAttributes => ({
  sameSite: 'strict',
  secure: window.location.protocol === 'https:',
  // js-cookie expects days; a missing value makes it a session cookie
  expires: seconds ? seconds / SECONDS_PER_DAY : undefined
})

export const cookieHelper = {
  getToken: () => Cookies.get(TOKEN_KEY),
  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),
  setTokens: (token?: IToken) => {
    if (token?.accessToken) Cookies.set(TOKEN_KEY, token.accessToken, cookieOptions(token.expiresIn))
    if (token?.refreshToken) Cookies.set(REFRESH_TOKEN_KEY, token.refreshToken, cookieOptions(token.refreshExpiresIn))
  },
  clearTokens: () => {
    Cookies.remove(TOKEN_KEY)
    Cookies.remove(REFRESH_TOKEN_KEY)
  }
}
