import { Download, Plus, ShieldAlert, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { PaginationCustom } from '~/components/customs/pagination-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { useAttendanceCalendarApi } from '~/hooks/apis/use-attendance-api'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useManagerOptionsApi } from '~/hooks/apis/use-employee-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { AttendanceRecordService } from '~/services/attendance.service'
import { DATA } from '~/shared/constants/data.constant'
import type { IAttendanceCalendarParams } from '~/shared/models/attendance.model'

import { AttendanceCalendar } from './components/attendance-calendar'
import { RecordFormDialog, type IRecordTarget } from './components/record-form-dialog'
import { RecordImportDialog } from './components/record-import-dialog'

type TFilter = { employeeId: string; month: string; year: string }

const now = new Date()
const DEFAULT_VALUES: TFilter = {
  employeeId: '',
  month: String(now.getMonth() + 1),
  year: String(now.getFullYear())
}

export function meta() {
  return [{ title: 'Attendance records · SPECOM HRM' }]
}

// Manual 6.4.1 Attendance Records. Spec: GET /attendance/records/calendar (needs EMPLOYEE_VIEW + ORG_VIEW too)
export default function AttendanceRecordsPage() {
  // Lib
  const { t } = useTranslation()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const has = (p: string) => !!me?.superAdmin || !!me?.permissions?.includes(p)
  const canView = has('ATTENDANCE_VIEW')
  const canManage = has('ATTENDANCE_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()

  // Table
  const { paging, setPage, setSize, toApiPaging } = usePagination()
  const [target, setTarget] = useState<IRecordTarget | undefined>()
  const [importing, setImporting] = useState(false)

  // Form — every filter applies at once (selects), so the form only mirrors the URL
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TFilter>({ defaultValues: urlValues })
  const enabled = isReady && canView
  const { data: employees = [] } = useManagerOptionsApi(companyId, enabled)
  const employeeOptions = employees.map((e) => ({
    label: [e.fullName, e.employeeCode].filter(Boolean).join(' · ') || '-',
    value: e.id ?? ''
  }))
  const filterEmployeeItems = [{ label: t('employee.filter.all'), value: '' }, ...employeeOptions]
  const monthItems = DATA.GET_MONTH_OPTIONS(t)
  const yearItems = DATA.GET_ATTENDANCE_YEAR_OPTIONS()

  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const year = Number(urlValues.year) || now.getFullYear()
  const month = Number(urlValues.month) || now.getMonth() + 1
  const params: IAttendanceCalendarParams = {
    ...toApiPaging(),
    companyId,
    year,
    month,
    employeeId: urlValues.employeeId || undefined
  }
  const appliedCount = [
    urlValues.employeeId,
    urlValues.month !== DEFAULT_VALUES.month,
    urlValues.year !== DEFAULT_VALUES.year
  ].filter(Boolean).length

  // API
  const { data: calendar, isLoading, isFetching } = useAttendanceCalendarApi(params, enabled)
  const totalPage = Math.ceil((calendar?.totalElements ?? 0) / paging.size)

  const { mutate: exportFile, isPending: isExporting } = useMutationApi({
    mutationFn: () => AttendanceRecordService.Export({ companyId, year, month, employeeId: params.employeeId }),
    onSuccess: (blob) => commonHelper.downloadBlob(blob, `attendance-${year}-${String(month).padStart(2, '0')}.xlsx`)
  })

  // Search — a select change applies at once and goes back to page 1
  const handleFilter = (key: keyof TFilter, value: string) => {
    form.setValue(key, value)
    updateQueries({ [key]: value || undefined, page: 1 })
  }

  // Reset
  const handleReset = () => {
    form.reset(DEFAULT_VALUES)
    updateQueries({ employeeId: undefined, month: DEFAULT_VALUES.month, year: DEFAULT_VALUES.year, page: 1 })
  }

  // Sync data and url
  useEffect(() => {
    setQuery({
      page: searchParams.get('page') ?? undefined,
      size: searchParams.get('size') ?? undefined,
      companyId: searchParams.get('companyId') ?? undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      month: searchParams.get('month') ?? DEFAULT_VALUES.month,
      year: searchParams.get('year') ?? DEFAULT_VALUES.year
    })
  }, [])

  if (!isLoadingMe && !canView) {
    return (
      <PageLayout>
        <div className='bg-card text-muted-foreground flex flex-col items-center gap-2 rounded-xl border p-10 text-center'>
          <ShieldAlert className='size-8' />
          <p>{t('common.no_permission')}</p>
        </div>
      </PageLayout>
    )
  }

  const select = (key: keyof TFilter, label: string, items: { label: string; value: string }[]) => (
    <Controller
      name={key}
      control={form.control}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={`attendance-${key}`}>{label}</FieldLabel>
          <Select items={items} value={field.value} onValueChange={(v) => handleFilter(key, v ?? '')}>
            <SelectTrigger id={`attendance-${key}`} className='h-[38px] w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value || 'all'} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    />
  )

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('attendance_record.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('attendance_record.subtitle')}</p>
        </div>
        {isReady && (
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' className='h-[38px]' onClick={() => exportFile()} disabled={isExporting}>
              <Download />
              {t('attendance_record.export')}
            </Button>
            {canManage && (
              <>
                <Button variant='outline' className='h-[38px]' onClick={() => setImporting(true)}>
                  <Upload />
                  {t('attendance_record.import.button')}
                </Button>
                <Button className='h-[38px]' onClick={() => setTarget({ employeeId: urlValues.employeeId })}>
                  <Plus />
                  {t('attendance_record.add')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('attendance.pick_company')} />
      ) : (
        <>
          <div className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'>
            {select('employeeId', t('attendance_record.field.employee'), filterEmployeeItems)}
            {select('month', t('attendance_record.filter.month'), monthItems)}
            {select('year', t('attendance_record.filter.year'), yearItems)}
            <div className='flex items-end gap-2'>
              <Button type='button' variant='outline' className='h-[38px]' onClick={handleReset}>
                {t('company.filter.clear')}
                {appliedCount > 0 && <Badge variant='secondary'>{appliedCount}</Badge>}
              </Button>
            </div>
          </div>

          <ul
            aria-label={t('attendance_record.legend')}
            className='bg-card flex flex-wrap gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-sm'
          >
            {DATA.GET_ATTENDANCE_LEGEND(t).map(({ key, label, icon: Icon, className }) => (
              <li key={key} className='flex items-center gap-1.5'>
                <Icon className={`size-4 ${className}`} />
                {label}
              </li>
            ))}
          </ul>

          <AttendanceCalendar
            year={year}
            month={month}
            rows={calendar?.rows ?? []}
            loading={isLoading || isFetching}
            onCellClick={
              canManage
                ? (row, cell) =>
                    setTarget({
                      recordId: cell.recordId,
                      employeeId: row.employeeId,
                      date: cell.date,
                      clockIn: cell.clockIn,
                      clockOut: cell.clockOut,
                      notes: cell.notes
                    })
                : undefined
            }
          />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-muted-foreground text-sm'>
              {t('attendance_record.showing', {
                count: calendar?.rows?.length ?? 0,
                total: calendar?.totalElements ?? 0
              })}
            </p>
            <PaginationCustom
              page={paging.page}
              size={paging.size}
              totalPage={totalPage}
              onPageChange={setPage}
              onSizeChange={setSize}
            />
          </div>
        </>
      )}

      <RecordFormDialog
        target={target}
        employees={employeeOptions}
        canManage={canManage}
        onClose={() => setTarget(undefined)}
      />
      <RecordImportDialog open={importing} companyId={companyId} onClose={() => setImporting(false)} />
    </PageLayout>
  )
}
