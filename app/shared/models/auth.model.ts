export interface ILoginPayload {
  username: string
  password: string
}

export interface IRefreshTokenPayload {
  refreshToken: string
}

// Spec: TokenDto — expiresIn / refreshExpiresIn are seconds
export interface IToken {
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  refreshExpiresIn?: number
}

// Spec: MeDto
export interface IMe {
  userId?: string
  username?: string
  companyId?: string
  superAdmin?: boolean
  roles?: string[]
  permissions?: string[]
}
