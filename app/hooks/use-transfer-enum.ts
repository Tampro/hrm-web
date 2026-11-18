import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/** Argument shape kept compatible with the team repo (`TGetTranslateEnum` = argument, not function) */
export type TGetTranslateEnum = string | null | undefined
export type TGetTranslateEnumFn = (value: TGetTranslateEnum) => string

/** Enum value → translated text via `enum.<VALUE>`; '-' when missing, the raw value when no key exists */
export const useTransferEnum = () => {
  const { t, i18n } = useTranslation()

  const getTranslateEnum = useCallback<TGetTranslateEnumFn>(
    (value) => {
      if (!value) return '-'
      const key = `enum.${value}`
      return i18n.exists(key) ? t(key) : value
    },
    [t, i18n]
  )

  return { getTranslateEnum }
}
