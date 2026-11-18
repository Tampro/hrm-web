import { Outlet } from 'react-router'

import { authHelper } from '~/helpers/auth.helper'

export const clientLoader = () => authHelper.handleProtectedRoute('AUTH_ONLY')

export default function AuthLayout() {
  return (
    <main className='bg-muted flex min-h-svh items-center justify-center p-4'>
      <Outlet />
    </main>
  )
}
