import { Outlet } from 'react-router'

import { authHelper } from '~/helpers/auth.helper'

export const clientLoader = () => authHelper.handleProtectedRoute('PRIVATE')

export default function PrivateLayout() {
  return <Outlet />
}
