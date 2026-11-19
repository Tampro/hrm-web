import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { calendarHelper } from '~/helpers/calendar.helper'
import { getHolidayCategoryName } from '~/helpers/columns/holiday-mgt-column'
import { dateHelper } from '~/helpers/date.helper'
import { useHolidayCalendarApi } from '~/hooks/apis/use-holiday-api'
import { cn } from '~/lib/utils'
import { DATA } from '~/shared/constants/data.constant'
import { ECalendarMode } from '~/shared/enums/holiday.enum'
import type { IHoliday, IHolidayCategory } from '~/shared/models/holiday.model'

interface IProps {
  companyId?: string
  categories: IHolidayCategory[]
  onOpen: (holiday: IHoliday) => void
}

// Manual 6.3.4 Calendar View: arrows, Today, Month / Week / Day, category legend.
// Spec: GET /org/holidays/calendar?from&to — holidays overlapping the shown range (≤ 400 days)
export function HolidayCalendar({ companyId, categories, onOpen }: IProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ECalendarMode>(ECalendarMode.Month)
  const [anchor, setAnchor] = useState(() => new Date())
  const today = new Date()
  const days = calendarHelper.visibleDays(mode, anchor)
  const from = dateHelper.toApiDate(days[0]) ?? ''
  const to = dateHelper.toApiDate(days.at(-1)) ?? ''
  const { data: holidays = [], isLoading } = useHolidayCalendarApi({ companyId, from, to })

  const holidaysOn = (day: Date) => {
    const key = dateHelper.toApiDate(day) ?? ''
    return holidays.filter((h) => (h.startDate ?? '') <= key && key <= (h.endDate ?? h.startDate ?? ''))
  }

  const title =
    mode === ECalendarMode.Month
      ? dateHelper.formatIntl(anchor, { month: 'long', year: 'numeric' })
      : mode === ECalendarMode.Week
        ? `${dateHelper.formatDate(from)} – ${dateHelper.formatDate(to)}`
        : dateHelper.formatIntl(anchor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const weekdays = calendarHelper
    .visibleDays(ECalendarMode.Week, today)
    .map((d) => dateHelper.formatIntl(d, { weekday: 'short' }))

  const chip = (h: IHoliday) => (
    <button
      key={h.id}
      type='button'
      onClick={() => onOpen(h)}
      title={h.name}
      className='w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white'
      style={{ backgroundColor: h.category?.color ?? 'var(--primary)' }}
    >
      {h.name}
    </button>
  )

  return (
    <section
      aria-label={t('holiday.calendar.title')}
      className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-4'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            aria-label={t('holiday.calendar.previous')}
            onClick={() => setAnchor(calendarHelper.shift(mode, anchor, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant='outline'
            size='icon'
            aria-label={t('holiday.calendar.next')}
            onClick={() => setAnchor(calendarHelper.shift(mode, anchor, 1))}
          >
            <ChevronRight />
          </Button>
          <Button variant='outline' className='h-[38px]' onClick={() => setAnchor(new Date())}>
            {t('holiday.calendar.today')}
          </Button>
          <h2 className='ml-2 text-lg font-semibold capitalize' aria-live='polite'>
            {title}
          </h2>
        </div>
        <TabsCustom value={mode} onChange={setMode} options={DATA.GET_CALENDAR_MODE_TABS(t)} isNoSyncParams />
      </div>

      {/* Manual: category legend with the colour codes */}
      <ul aria-label={t('holiday.calendar.legend')} className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
        {categories.map((c) => (
          <li key={c.id} className='flex items-center gap-1.5'>
            <span aria-hidden className='size-3 rounded-full' style={{ backgroundColor: c.color }} />
            {getHolidayCategoryName(t, c)}
          </li>
        ))}
      </ul>

      {isLoading ? (
        <Skeleton className='h-96 w-full' />
      ) : mode === ECalendarMode.Day ? (
        <div className='flex flex-col gap-2'>
          {holidaysOn(anchor).length ? (
            holidaysOn(anchor).map((h) => (
              <div key={h.id} className='flex flex-wrap items-center gap-3 rounded-md border p-3'>
                <div className='w-56 max-w-full'>{chip(h)}</div>
                <span className='text-muted-foreground text-sm'>
                  {dateHelper.formatDateRange(h.startDate, h.endDate)}
                </span>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground p-6 text-center text-sm'>{t('holiday.calendar.no_holiday')}</p>
          )}
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <div
            role='grid'
            aria-label={title}
            className='grid min-w-[42rem] grid-cols-7 overflow-hidden rounded-md border'
          >
            {weekdays.map((w) => (
              <div
                key={w}
                role='columnheader'
                className='bg-muted/50 border-b p-2 text-center text-xs font-medium uppercase'
              >
                {w}
              </div>
            ))}
            {days.map((day) => {
              const inMonth = mode !== ECalendarMode.Month || day.getMonth() === anchor.getMonth()
              const isToday = dateHelper.isSameDay(day, today)
              return (
                <div
                  key={day.toISOString()}
                  role='gridcell'
                  aria-label={dateHelper.formatDate(dateHelper.toApiDate(day))}
                  className={cn(
                    'flex flex-col gap-1 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0',
                    mode === ECalendarMode.Week ? 'min-h-40' : 'min-h-24',
                    !inMonth && 'bg-muted/60 text-muted-foreground/60'
                  )}
                >
                  <span
                    className={cn(
                      'self-end text-xs',
                      isToday &&
                        'bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full'
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {holidaysOn(day).map(chip)}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
