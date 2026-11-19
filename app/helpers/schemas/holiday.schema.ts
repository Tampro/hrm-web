import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, required, requiredText } from '~/helpers/schema.helper'
import { EHolidayFilterFormKey, EHolidayFormKey } from '~/shared/enums/form.enum'

const text = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

/** Spec: HolidayService — at most 400 days per holiday (EMP_036) */
export const MAX_HOLIDAY_DAYS = 400

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1

// Spec: HolidayForm — name ≤ 150, category, start / end required, end ≥ start (EMP_034), ≤ 400 days (EMP_036),
// description ≤ 500, branchIds ≤ 200 (empty = all branches)
export const getHolidaySchema = (t?: TFunction) =>
  z
    .object({
      [EHolidayFormKey.Name]: requiredText(150, t),
      [EHolidayFormKey.CategoryId]: z.string().min(1, required(t)),
      [EHolidayFormKey.StartDate]: z.string().min(1, required(t)),
      [EHolidayFormKey.EndDate]: z.string().min(1, required(t)),
      [EHolidayFormKey.Description]: text(500, t),
      [EHolidayFormKey.BranchIds]: z.array(z.string()).max(200)
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: [EHolidayFormKey.EndDate],
      message: t?.('holiday.validation.end_before_start')
    })
    .refine((v) => !v.startDate || !v.endDate || daysBetween(v.startDate, v.endDate) <= MAX_HOLIDAY_DAYS, {
      path: [EHolidayFormKey.EndDate],
      message: t?.('holiday.validation.too_long', { max: MAX_HOLIDAY_DAYS })
    })

export type THolidaySchema = z.infer<ReturnType<typeof getHolidaySchema>>

// Spec: list filters — keyword, categoryId, year, dateFrom / dateTo (overlap)
export const getHolidayFilterSchema = (t?: TFunction) =>
  z
    .object({
      [EHolidayFilterFormKey.Keyword]: text(255, t),
      [EHolidayFilterFormKey.CategoryId]: z.string(),
      [EHolidayFilterFormKey.Year]: z.string(),
      [EHolidayFilterFormKey.DateFrom]: z.string(),
      [EHolidayFilterFormKey.DateTo]: z.string()
    })
    .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
      path: [EHolidayFilterFormKey.DateTo],
      message: t?.('validation.date_range')
    })

export type THolidayFilterSchema = z.infer<ReturnType<typeof getHolidayFilterSchema>>
