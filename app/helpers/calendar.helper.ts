import { dateHelper } from '~/helpers/date.helper'
import { ECalendarMode } from '~/shared/enums/holiday.enum'

export const calendarHelper = {
  /** Days shown around `anchor`: 6 weeks for a month grid (Monday first), Monday–Sunday for a week, one day */
  visibleDays: (mode: ECalendarMode, anchor: Date) => {
    if (mode === ECalendarMode.Day) return [anchor]
    if (mode === ECalendarMode.Week) {
      const start = dateHelper.startOfWeek(anchor)
      return Array.from({ length: 7 }, (_, i) => dateHelper.addDays(start, i))
    }
    const start = dateHelper.startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
    return Array.from({ length: 42 }, (_, i) => dateHelper.addDays(start, i))
  },

  /** Anchor of the next (step 1) or previous (step -1) month, week or day */
  shift: (mode: ECalendarMode, anchor: Date, step: number) => {
    if (mode === ECalendarMode.Month) return new Date(anchor.getFullYear(), anchor.getMonth() + step, 1)
    return dateHelper.addDays(anchor, step * (mode === ECalendarMode.Week ? 7 : 1))
  }
}
