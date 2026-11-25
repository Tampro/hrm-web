import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, numberText, required, requiredText } from '~/helpers/schema.helper'
import {
  EAttendancePolicyFormKey,
  EAttendanceRecordFormKey,
  EShiftFormKey,
  ETimesheetEntryFormKey
} from '~/shared/enums/form.enum'

const text = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

/** Number typed as text with an upper bound (Spec: @Max) */
const boundedNumber = (t: TFunction | undefined, max: number, opts: { required?: boolean; integer?: boolean } = {}) =>
  numberText(t, { required: opts.required, integer: opts.integer }).refine(
    (v) => v === '' || Number.isNaN(Number(v)) || Number(v) <= max,
    { message: t?.('validation.max_value', { max }) }
  )

// Spec: ShiftForm — name ≤ 150, start / end required (HH:mm), break 0–1440 min, grace 0–720 min; a day shift must
// end after it starts (a night shift may end on the next day); both break times or neither
export const getShiftSchema = (t?: TFunction) =>
  z
    .object({
      [EShiftFormKey.Name]: requiredText(150, t),
      [EShiftFormKey.Description]: text(500, t),
      [EShiftFormKey.StartTime]: z.string().min(1, required(t)),
      [EShiftFormKey.EndTime]: z.string().min(1, required(t)),
      [EShiftFormKey.BreakDurationMinutes]: boundedNumber(t, 1440, { integer: true }),
      [EShiftFormKey.BreakStartTime]: z.string(),
      [EShiftFormKey.BreakEndTime]: z.string(),
      [EShiftFormKey.GracePeriodMinutes]: boundedNumber(t, 720, { integer: true }),
      [EShiftFormKey.NightShift]: z.boolean(),
      [EShiftFormKey.Active]: z.boolean()
    })
    .refine((v) => v.nightShift || !v.startTime || !v.endTime || v.endTime > v.startTime, {
      path: [EShiftFormKey.EndTime],
      message: t?.('shift.validation.end_after_start')
    })
    .refine((v) => !v.breakStartTime === !v.breakEndTime, {
      path: [EShiftFormKey.BreakEndTime],
      message: t?.('shift.validation.break_pair')
    })

export type TShiftSchema = z.infer<ReturnType<typeof getShiftSchema>>

// Spec: PolicyForm — name ≤ 150, grace minutes 0–720, half-day threshold 0–24 h (2 decimals), overtime rate ≥ 0
// required (company currency)
export const getAttendancePolicySchema = (t?: TFunction) =>
  z.object({
    [EAttendancePolicyFormKey.Name]: requiredText(150, t),
    [EAttendancePolicyFormKey.Description]: text(500, t),
    [EAttendancePolicyFormKey.LateArrivalGraceMinutes]: boundedNumber(t, 720, { required: true, integer: true }),
    [EAttendancePolicyFormKey.EarlyDepartureGraceMinutes]: boundedNumber(t, 720, { required: true, integer: true }),
    [EAttendancePolicyFormKey.HalfDayThresholdHours]: boundedNumber(t, 24, { required: true }),
    [EAttendancePolicyFormKey.OvertimeRatePerHour]: numberText(t, { required: true }),
    [EAttendancePolicyFormKey.Active]: z.boolean()
  })

export type TAttendancePolicySchema = z.infer<ReturnType<typeof getAttendancePolicySchema>>

// Shifts filter: keyword + day / night ('' = both)
export const getShiftFilterSchema = (t?: TFunction) =>
  z.object({ keyword: z.string().trim().max(255, maxLength(255, t)), nightShift: z.string() })

export type TShiftFilterSchema = z.infer<ReturnType<typeof getShiftFilterSchema>>

// Spec: RecordForm — employee and date required, notes ≤ 500; clock-out needs a clock-in (ATT_010); no clock times on a
// future date (ATT_011). A clock-out before the clock-in means the next day (night shift), so no order check here.
export const getAttendanceRecordSchema = (t?: TFunction, today = new Date().toLocaleDateString('sv-SE')) =>
  z
    .object({
      [EAttendanceRecordFormKey.EmployeeId]: z.string().min(1, required(t)),
      [EAttendanceRecordFormKey.Date]: z.string().min(1, required(t)),
      [EAttendanceRecordFormKey.ClockIn]: z.string(),
      [EAttendanceRecordFormKey.ClockOut]: z.string(),
      [EAttendanceRecordFormKey.Notes]: text(500, t)
    })
    .refine((v) => !v.clockOut || !!v.clockIn, {
      path: [EAttendanceRecordFormKey.ClockIn],
      message: t?.('attendance_record.validation.clock_out_without_in')
    })
    .refine((v) => !(v.clockIn || v.clockOut) || !v.date || v.date <= today, {
      path: [EAttendanceRecordFormKey.Date],
      message: t?.('attendance_record.validation.future_date')
    })

export type TAttendanceRecordSchema = z.infer<ReturnType<typeof getAttendanceRecordSchema>>

// Spec: EntryForm — employee, date, hours 0.25–24 (2 decimals), description ≤ 1000 required, project ≤ 150;
// no future date (ATT_032). The 24 h per day limit (ATT_031) needs the other entries: the backend checks it.
export const getTimesheetEntrySchema = (t?: TFunction, today = new Date().toLocaleDateString('sv-SE')) =>
  z.object({
    [ETimesheetEntryFormKey.EmployeeId]: z.string().min(1, required(t)),
    [ETimesheetEntryFormKey.Date]: z
      .string()
      .min(1, required(t))
      .refine((v) => v <= today, { message: t?.('timesheet.validation.future_date') }),
    [ETimesheetEntryFormKey.Hours]: numberText(t, { required: true }).refine(
      (v) =>
        v === '' || Number.isNaN(Number(v)) || (Number(v) >= 0.25 && Number(v) <= 24 && /^\d+(\.\d{1,2})?$/.test(v)),
      { message: t?.('timesheet.validation.hours_range') }
    ),
    [ETimesheetEntryFormKey.Project]: text(150, t),
    [ETimesheetEntryFormKey.Description]: requiredText(1000, t)
  })

export type TTimesheetEntrySchema = z.infer<ReturnType<typeof getTimesheetEntrySchema>>
