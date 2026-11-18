import { useCallback, useMemo } from 'react'

import { commonHelper } from '~/helpers/common.helper'
import { useQueryParams } from '~/hooks/use-query-params'

export const DEFAULT_PAGE = 1
export const DEFAULT_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50]

export interface IPaging {
  /** 1-based, as shown to the user and kept in the URL */
  page: number
  size: number
}

/** Paging lives in the URL (?page=&size=). The API is zero-based: use `toApiPaging`. */
export const usePagination = () => {
  const { searchParams, updateQueries } = useQueryParams()

  const paging = useMemo<IPaging>(
    () => ({
      page: commonHelper.toPositiveInt(searchParams.get('page'), DEFAULT_PAGE),
      size: commonHelper.toPositiveInt(searchParams.get('size'), DEFAULT_SIZE)
    }),
    [searchParams]
  )

  const setPage = useCallback((page: number) => updateQueries({ page }), [updateQueries])
  const setSize = useCallback((size: number) => updateQueries({ size, page: DEFAULT_PAGE }), [updateQueries])

  /** New search: back to page 1, keep the size */
  const getSearchPaging = useCallback((): IPaging => ({ page: DEFAULT_PAGE, size: paging.size }), [paging.size])
  const getResetPaging = useCallback((): IPaging => ({ page: DEFAULT_PAGE, size: DEFAULT_SIZE }), [])
  const resetPaging = useCallback(() => updateQueries({ page: DEFAULT_PAGE, size: DEFAULT_SIZE }), [updateQueries])

  const toApiPaging = useCallback((p: IPaging = paging) => ({ page: p.page - 1, size: p.size }), [paging])

  return { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging }
}
