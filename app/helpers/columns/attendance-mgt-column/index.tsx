import type { TFunction } from 'i18next'
import { Moon, Pencil, Sun, Trash2 } from 'lucide-react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { commonHelper } from '~/helpers/common.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IAttendancePolicy, IShift } from '~/shared/models/attendance.model'

export type TAttendanceRowAction = 'edit' | 'delete'

interface IRowOptions<T> {
  onAction: (action: TAttendanceRowAction, row: T) => void
  onToggle: (row: T, active: boolean) => void
  canManage: boolean
  togglingId?: string
}

/** "08:00:00" → "08:00" (Spec: LocalTime is serialised with seconds) */
export const shortTime = (value?: string | null) => (value ? value.slice(0, 5) : '-')

/** Status switch for ATTENDANCE_MANAGE, plain text otherwise */
const statusCell = <T extends { id?: string; name?: string; status?: EOrgStatus }>(
  t: TFunction,
  getTranslateEnum: TGetTranslateEnumFn,
  row: T,
  { onToggle, canManage, togglingId }: IRowOptions<T>
) =>
  canManage ? (
    <div className='flex items-center gap-2'>
      <Switch
        checked={row.status === EOrgStatus.Active}
        disabled={togglingId === row.id}
        onCheckedChange={(checked) => onToggle(row, checked)}
        aria-label={t('attendance.toggle_named', { name: row.name ?? '' })}
      />
      <span className='text-sm'>{getTranslateEnum(row.status)}</span>
    </div>
  ) : (
    getTranslateEnum(row.status)
  )

const actionsCell = <T extends { name?: string }>(t: TFunction, row: T, { onAction, canManage }: IRowOptions<T>) =>
  canManage && (
    <div className='flex justify-end gap-1'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('attendance.edit_named', { name: row.name ?? '' })}
        onClick={() => onAction('edit', row)}
      >
        <Pencil />
      </Button>
      <Button
        variant='ghost'
        size='icon-sm'
        className='text-destructive'
        aria-label={t('attendance.delete_named', { name: row.name ?? '' })}
        onClick={() => onAction('delete', row)}
      >
        <Trash2 />
      </Button>
    </div>
  )

const nameCell = (row: { name?: string; description?: string | null }) => (
  <div className='min-w-0'>
    <p className='truncate font-medium'>{row.name || '-'}</p>
    {row.description && <p className='text-muted-foreground line-clamp-2 text-xs'>{row.description}</p>}
  </div>
)

export const attendanceMgtColumn = {
  // Manual 6.4.5 Shifts: name, time (day / night), break, grace period, working hours, status, actions
  getShift: (t: TFunction, getTranslateEnum: TGetTranslateEnumFn, options: IRowOptions<IShift>): IColumn<IShift>[] => [
    { id: 'name', header: t('shift.field.name'), cell: nameCell },
    {
      id: 'time',
      header: t('shift.field.time'),
      cell: (row) => (
        <div className='flex flex-col items-start gap-1'>
          <span className='font-mono text-sm'>
            {shortTime(row.startTime)} – {shortTime(row.endTime)}
          </span>
          <Badge
            variant='outline'
            className={row.nightShift ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : undefined}
          >
            {row.nightShift ? <Moon /> : <Sun />}
            {t(row.nightShift ? 'shift.night' : 'shift.day')}
          </Badge>
        </div>
      )
    },
    {
      id: 'break',
      header: t('shift.field.break'),
      cell: (row) => (
        <div className='text-sm'>
          <p>{t('attendance.minutes', { value: row.breakDurationMinutes ?? 0 })}</p>
          {row.breakStartTime && (
            <p className='text-muted-foreground font-mono text-xs'>
              {shortTime(row.breakStartTime)} – {shortTime(row.breakEndTime)}
            </p>
          )}
        </div>
      )
    },
    {
      id: 'grace',
      header: t('shift.field.grace'),
      cell: (row) => t('attendance.minutes', { value: row.gracePeriodMinutes ?? 0 })
    },
    {
      id: 'working',
      header: t('shift.field.working_hours'),
      cell: (row) => t('attendance.hours', { value: commonHelper.formatNumber((row.workingMinutes ?? 0) / 60, 2) })
    },
    { id: 'status', header: t('shift.field.status'), cell: (row) => statusCell(t, getTranslateEnum, row, options) },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-24 text-right',
      cell: (row) => actionsCell(t, row, options)
    }
  ],

  // Manual 6.4.6 Attendance Policies: name, late arrival / early departure grace, half day, overtime rate, status
  getAttendancePolicy: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    options: IRowOptions<IAttendancePolicy>,
    currency?: { code?: string; symbol?: string | null } | null
  ): IColumn<IAttendancePolicy>[] => [
    { id: 'name', header: t('attendance_policy.field.name'), cell: nameCell },
    {
      id: 'late',
      header: t('attendance_policy.field.late_grace'),
      cell: (row) => t('attendance.minutes', { value: row.lateArrivalGraceMinutes ?? 0 })
    },
    {
      id: 'early',
      header: t('attendance_policy.field.early_grace'),
      cell: (row) => t('attendance.minutes', { value: row.earlyDepartureGraceMinutes ?? 0 })
    },
    {
      id: 'halfDay',
      header: t('attendance_policy.field.half_day'),
      cell: (row) => t('attendance.hours', { value: commonHelper.formatNumber(row.halfDayThresholdHours, 2) })
    },
    {
      id: 'overtime',
      header: t('attendance_policy.field.overtime_rate'),
      cell: (row) =>
        t('attendance_policy.per_hour', { value: commonHelper.formatMoney(row.overtimeRatePerHour, currency) })
    },
    {
      id: 'status',
      header: t('attendance_policy.field.status'),
      cell: (row) => statusCell(t, getTranslateEnum, row, options)
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-24 text-right',
      cell: (row) => actionsCell(t, row, options)
    }
  ]
}
