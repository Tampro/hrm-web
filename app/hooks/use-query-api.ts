import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { IApiPagination, IApiResponse } from '~/shared/models/common.model'

/**
 * List hook factory: `createListApiHook(QUERY_KEY.X.GET_LIST, XService.GetList…)`.
 * Returns the page content plus totals; keeps the previous page while the next one loads.
 */
export const createListApiHook =
  <TItem, TParams>(key: string, fetcher: (params?: TParams) => Promise<IApiResponse<IApiPagination<TItem>>>) =>
  ({ params, enabled = true }: { params?: TParams; enabled?: boolean } = {}) => {
    const query = useQuery({
      queryKey: [key, params],
      queryFn: () => fetcher(params),
      placeholderData: keepPreviousData,
      enabled
    })
    const data = query.data?.data
    return {
      ...query,
      dataList: data?.content ?? [],
      totalPage: data?.totalPages ?? 0,
      totalElement: data?.totalElements ?? 0
    }
  }

/** Detail hook factory: `createDetailApiHook(QUERY_KEY.X.GET_DETAIL, XService.GetDetail)` → `{ data }` */
export const createDetailApiHook =
  <TData>(key: string, fetcher: (id: string) => Promise<IApiResponse<TData>>) =>
  ({ id, enabled = true }: { id?: string; enabled?: boolean }) => {
    const query = useQuery({
      queryKey: [key, id],
      queryFn: () => fetcher(id as string),
      enabled: enabled && !!id
    })
    return { ...query, detail: query.data?.data }
  }
