import i18next from 'i18next'

const LOCALE_BY_LANGUAGE: Record<string, string> = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' }

export const commonHelper = {
  /** Positive integer from a URL value, or the fallback (never NaN) */
  toPositiveInt: (value: string | null | undefined, fallback: number) => {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  },

  /** Locale-aware number, '-' when missing */
  formatNumber: (value: number | null | undefined, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-'
    return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[i18next.language] ?? 'vi-VN', {
      maximumFractionDigits: digits
    }).format(value)
  },

  getLocale: () => LOCALE_BY_LANGUAGE[i18next.language] ?? 'vi-VN',

  /**
   * Money in a currency: ISO code → Intl currency format (e.g. 490.000 ₫), otherwise the number + symbol/code.
   * '-' when the amount is missing.
   */
  formatMoney: (value: number | null | undefined, currency?: { code?: string; symbol?: string | null } | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-'
    const locale = commonHelper.getLocale()
    if (currency?.code) {
      try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.code }).format(value)
      } catch {
        // not an ISO 4217 code: fall through to number + symbol
      }
    }
    const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
    const unit = currency?.symbol || currency?.code
    return unit ? `${amount} ${unit}` : amount
  },

  /** Locale-aware percentage of a 0–100 value (e.g. 20 → 20%), '-' when missing */
  formatPercent: (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-'
    return new Intl.NumberFormat(commonHelper.getLocale(), { style: 'percent', maximumFractionDigits: 2 }).format(
      value / 100
    )
  },

  /** Value from the URL when it is one of the enum values, otherwise the fallback */
  toEnumValue: <T extends string>(value: string | null | undefined, values: readonly T[], fallback: T): T =>
    values.includes(value as T) ? (value as T) : fallback
}
