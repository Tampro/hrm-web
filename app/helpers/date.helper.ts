import { commonHelper } from '~/helpers/common.helper'

/** Backend day format (Spec: dates are YYYY-MM-DD) */
export const DATE_FORMAT_API = 'YYYY-MM-DD'
/** Display format */
export const DATE_FORMAT_SLASH = 'DD/MM/YYYY'

const pad = (n: number) => String(n).padStart(2, '0')

export const dateHelper = {
  /** ISO instant or YYYY-MM-DD → DD/MM/YYYY in the user's time zone, '-' when missing/invalid */
  formatDate: (value: string | null | undefined) => {
    if (!value) return '-'
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? dateHelper.parseApiDate(value) : new Date(value)
    if (!date || Number.isNaN(date.getTime())) return '-'
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
  },

  /** ISO instant → localized date + time, '-' when missing/invalid */
  formatDateTime: (value: string | null | undefined) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat(commonHelper.getLocale(), { dateStyle: 'short', timeStyle: 'short' }).format(date)
  },

  /** Local calendar day → YYYY-MM-DD (no UTC shift) */
  toApiDate: (date: Date | null | undefined) =>
    date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : undefined,

  /** YYYY-MM-DD → local Date at midnight, undefined when invalid */
  parseApiDate: (value: string | null | undefined) => {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return undefined
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    return Number.isNaN(date.getTime()) ? undefined : date
  },

  /** New local date `days` later (negative = earlier) */
  addDays: (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days),

  /** Monday of the week of `date` (weeks start on Monday) */
  startOfWeek: (date: Date) => dateHelper.addDays(date, -((date.getDay() + 6) % 7)),

  /** Same calendar day (time ignored) */
  isSameDay: (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(),

  /** Localized date text, e.g. { month: 'long', year: 'numeric' } → "tháng 11 năm 2026" */
  formatIntl: (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(commonHelper.getLocale(), options).format(date),

  /** Day range "DD/MM/YYYY" or "DD/MM/YYYY – DD/MM/YYYY" when it spans several days */
  formatDateRange: (start: string | null | undefined, end: string | null | undefined) =>
    !end || end === start
      ? dateHelper.formatDate(start)
      : `${dateHelper.formatDate(start)} – ${dateHelper.formatDate(end)}`
}
