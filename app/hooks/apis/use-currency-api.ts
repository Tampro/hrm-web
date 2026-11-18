import { useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { CurrencyService } from '~/services/plan.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

export const useGetAdminListCurrencyApi = createListApiHook(
  QUERY_KEY.CURRENCY.GET_ADMIN_LIST,
  CurrencyService.GetAdminListCurrency
)

export const useGetAdminCurrencyDetailApi = createDetailApiHook(
  QUERY_KEY.CURRENCY.GET_ADMIN_DETAIL,
  CurrencyService.GetAdminDetail
)

/** A currency write can move the default flag, which changes how every price is shown: refresh the picker list too */
export const useInvalidateCurrencies = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [QUERY_KEY.CURRENCY.GET_ADMIN_LIST, QUERY_KEY.CURRENCY.GET_ADMIN_DETAIL, QUERY_KEY.CURRENCY.GET_LIST].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    )
}
