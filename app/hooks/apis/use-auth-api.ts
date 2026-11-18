import { useQuery } from '@tanstack/react-query'

import { AuthService } from '~/services/auth.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

/** Current user (Spec: GET /me). The FE hides menus and buttons by it; the server re-checks every call. */
export const useMeApi = () =>
  useQuery({
    queryKey: [QUERY_KEY.AUTH.ME],
    queryFn: AuthService.GetMe,
    select: (res) => res?.data,
    staleTime: 5 * 60 * 1000
  })
