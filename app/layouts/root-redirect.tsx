import { authHelper } from '~/helpers/auth.helper'

export const clientLoader = () => authHelper.handleProtectedRoute('ROOT')

export default function RootRedirect() {
  return null
}
