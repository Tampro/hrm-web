// Spec: UserDto (IAM)
export interface IUser {
  id?: string
  companyId?: string
  username?: string
  email?: string
  fullName?: string
  status?: 'ACTIVE' | 'LOCKED'
  roles?: string[]
  createdDate?: string
  updatedDate?: string
}
