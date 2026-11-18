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

  getLocale: () => LOCALE_BY_LANGUAGE[i18next.language] ?? 'vi-VN'
}
