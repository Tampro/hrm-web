import { Clock, LogOut, TimerReset } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '~/components/customs/avatar-custom'
import { Skeleton } from '~/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { shortTime } from '~/helpers/columns/attendance-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { cn } from '~/lib/utils'
import { ATTENDANCE_DAY_STYLE } from '~/shared/constants/data.constant'
import { EDayStatus } from '~/shared/enums/attendance.enum'
import type { IAttendanceDayCell, IAttendanceEmployeeRow } from '~/shared/models/attendance.model'

interface IProps {
  year: number
  month: number
  rows: IAttendanceEmployeeRow[]
  loading?: boolean
  /** a day cell was clicked (open the record, or add one for that day) */
  onCellClick?: (row: IAttendanceEmployeeRow, cell: IAttendanceDayCell) => void
}

/** Days 1…n of the month as YYYY-MM-DD */
const daysOf = (year: number, month: number) =>
  Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) =>
    dateHelper.toApiDate(new Date(year, month - 1, i + 1))
  )

// Manual 6.4.1 attendance calendar: one row per employee, one column per day, Total = attended / working days
export function AttendanceCalendar({ year, month, rows, loading, onCellClick }: IProps) {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const days = daysOf(year, month)

  const cellLabel = (row: IAttendanceEmployeeRow, cell: IAttendanceDayCell) =>
    [
      `${row.fullName ?? '-'} · ${dateHelper.formatDate(cell.date)}`,
      getTranslateEnum(cell.status),
      cell.late && t('attendance_record.flag.late'),
      cell.earlyDeparture && t('attendance_record.flag.early'),
      cell.overtime && t('attendance_record.flag.overtime')
    ]
      .filter(Boolean)
      .join(', ')

  return (
    <div className='bg-card overflow-x-auto rounded-xl border'>
      <table className='w-max min-w-full border-collapse text-sm'>
        <thead>
          <tr className='bg-muted/50'>
            <th scope='col' className='bg-muted sticky left-0 z-10 min-w-56 px-3 py-2 text-left font-medium'>
              {t('attendance_record.field.employee')}
            </th>
            {days.map((d) => {
              const date = new Date(`${d}T00:00:00`)
              return (
                <th key={d} scope='col' className='w-9 px-0.5 py-2 text-center font-medium'>
                  <span className='block'>{date.getDate()}</span>
                  <span className='text-muted-foreground block text-[10px] font-normal'>
                    {dateHelper.formatIntl(date, { weekday: 'narrow' })}
                  </span>
                </th>
              )
            })}
            <th scope='col' className='px-3 py-2 text-right font-medium'>
              {t('attendance_record.field.total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && !rows.length
            ? Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className='border-t'>
                  <td colSpan={days.length + 2} className='p-3'>
                    <Skeleton className='h-6 w-full' />
                  </td>
                </tr>
              ))
            : rows.map((row) => {
                const byDate = new Map((row.days ?? []).map((c) => [c.date, c]))
                return (
                  <tr key={row.employeeId} className='border-t'>
                    <th scope='row' className='bg-card sticky left-0 z-10 px-3 py-2 text-left font-normal'>
                      <div className='flex items-center gap-2'>
                        <Avatar name={row.fullName} src={row.profileImageUrl} size='sm' />
                        <div className='min-w-0'>
                          <p className='truncate font-medium'>{row.fullName || '-'}</p>
                          <p className='text-muted-foreground truncate text-xs'>
                            {[row.employeeCode, row.designation].filter(Boolean).join(' · ') || '-'}
                          </p>
                        </div>
                      </div>
                    </th>
                    {days.map((d) => {
                      const cell = byDate.get(d) ?? { date: d, status: EDayStatus.NotAdded }
                      const style =
                        ATTENDANCE_DAY_STYLE[cell.status ?? EDayStatus.NotAdded] ??
                        ATTENDANCE_DAY_STYLE[EDayStatus.NotAdded]
                      const Icon = style.icon
                      const label = cellLabel(row, cell)
                      const clickable = !!onCellClick && cell.status !== EDayStatus.Future
                      return (
                        <td key={d} className={cn('px-0.5 py-1 text-center', cell.weekend && 'bg-muted/60')}>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type='button'
                                  aria-label={label}
                                  disabled={!clickable}
                                  onClick={() => onCellClick?.(row, cell)}
                                  className='hover:bg-accent relative inline-flex size-8 items-center justify-center rounded-md disabled:cursor-default disabled:hover:bg-transparent'
                                />
                              }
                            >
                              <Icon className={cn('size-4', style.className)} />
                              {(cell.late || cell.earlyDeparture || cell.overtime) && (
                                <span className='absolute -top-0.5 -right-0.5 flex'>
                                  {cell.late && <Clock className='size-2.5 text-amber-600' />}
                                  {cell.earlyDeparture && <LogOut className='size-2.5 text-orange-600' />}
                                  {cell.overtime && <TimerReset className='size-2.5 text-violet-600' />}
                                </span>
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{label}</p>
                              {(cell.clockIn || cell.clockOut) && (
                                <p>
                                  {t('attendance_record.clock_range', {
                                    in: shortTime(cell.clockIn),
                                    out: shortTime(cell.clockOut)
                                  })}
                                </p>
                              )}
                              {cell.notes && <p>{cell.notes}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      )
                    })}
                    <td className='px-3 py-2 text-right font-medium whitespace-nowrap'>
                      {commonHelper.formatNumber(row.attended ?? 0)} / {row.workingDays ?? 0}
                    </td>
                  </tr>
                )
              })}
          {!loading && !rows.length && (
            <tr className='border-t'>
              <td colSpan={days.length + 2} className='text-muted-foreground p-8 text-center'>
                {t('attendance_record.empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
