import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export type TQueryValue = string | number | boolean | null | undefined

const toSearchParams = (base: URLSearchParams, values: Record<string, TQueryValue>) => {
  const next = new URLSearchParams(base)
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') next.delete(key)
    else next.set(key, String(value))
  })
  return next
}

/**
 * URL query string as page state (filters survive F5 and back-navigation).
 * - `setQuery` REPLACES the whole query string (mount sync).
 * - `updateQuery` / `updateQueries` MERGE into it (search, reset, paging).
 */
export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const setQuery = useCallback(
    (values: Record<string, TQueryValue>) =>
      setSearchParams(toSearchParams(new URLSearchParams(), values), { replace: true }),
    [setSearchParams]
  )

  const updateQueries = useCallback(
    (values: Record<string, TQueryValue>) => setSearchParams((prev) => toSearchParams(prev, values)),
    [setSearchParams]
  )

  const updateQuery = useCallback((key: string, value: TQueryValue) => updateQueries({ [key]: value }), [updateQueries])

  return { searchParams, setQuery, updateQuery, updateQueries }
}
