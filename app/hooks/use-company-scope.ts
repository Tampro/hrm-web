import { useSearchParams } from 'react-router'

import { useMeApi } from '~/hooks/apis/use-auth-api'

/**
 * Company the company-scoped pages (employees, branches, …) act on. Spec: super admin must pass companyId (EMP_019), chosen with the company
 * picker and kept in the URL (?companyId=); a company user always acts on the company of the token.
 */
export const useCompanyScope = () => {
  const { data: me, isLoading } = useMeApi()
  const [searchParams] = useSearchParams()
  const isSuperAdmin = !!me?.superAdmin
  const companyId = isSuperAdmin ? searchParams.get('companyId') || undefined : undefined
  return {
    isLoading,
    isSuperAdmin,
    companyId,
    /** false while a super admin has not picked a company: queries wait, pages show the picker */
    isReady: !isLoading && (!isSuperAdmin || !!companyId)
  }
}
