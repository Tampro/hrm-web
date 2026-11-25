import { ChevronLeft, ChevronRight, Download, Plus, Search, ShieldAlert, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { Avatar } from '~/components/customs/avatar-custom'
import { PaginationCustom } from '~/components/customs/pagination-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { formHelper } from '~/helpers/form.helper'
import { useTimesheetWeekApi } from '~/hooks/apis/use-attendance-api'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useManagerOptionsApi } from '~/hooks/apis/use-employee-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { cn } from '~/lib/utils'
import { PageLayout } from '~/layouts/page.layout'
import { TimesheetService } from '~/services/attendance.service'
import { APPROVAL_STATUS_BADGE, DATA } from '~/shared/constants/data.constant'
import { EApprovalStatus } from '~/shared/enums/attendance.enum'
import type { ITimesheetEntry, ITimesheetWeekParams } from '~/shared/models/attendance.model'

import { ImportDialog } from '../components/import-dialog'
import { TimesheetDayDialog, type ITimesheetDay } from './components/timesheet-day-dialog'
import { TimesheetEntryDialog } from './components/timesheet-entry-dialog'

type TFilter = { keyword: string; employeeId: string }

const DEFAULT_VALUES: TFilter = { keyword: '', employeeId: '' }

/** Monday of the week that holds `value` (YYYY-MM-DD), today when missing or invalid */
const mondayOf = (value?: string | null) => {
  const parsed = dateHelper.parseApiDate(value ?? '')
  return dateHelper.startOfWeek(parsed ?? new Date())
}

export function meta() {
  return [{ title: 'Timesheet · SPECOM HRM' }]
}

// Manual 6.4.2 Timesheet. Spec: GET /attendance/timesheets/week (rows + counts of the week)
export default function TimesheetsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const has = (p: string) => !!me?.superAdmin || !!me?.permissions?.includes(p)
  const canView = has('ATTENDANCE_VIEW')
  const canManage = has('ATTENDANCE_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const tab = commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EApprovalStatus), EApprovalStatus.All)
  const monday = mondayOf(searchParams.get('date'))
  const days = Array.from({ length: 7 }, (_, i) => dateHelper.toApiDate(dateHelper.addDays(monday, i)) ?? '')

  // Table
  const { paging, setPage, setSize, getSearchPaging, toApiPaging } = usePagination()
  const [entry, setEntry] = useState<ITimesheetEntry | undefined>()
  const [viewing, setViewing] = useState(false)
  const [day, setDay] = useState<ITimesheetDay | undefined>()
  const [importing, setImporting] = useState(false)

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TFilter>({ defaultValues: urlValues })
  const enabled = isReady && canView
  const { data: employees = [] } = useManagerOptionsApi(companyId, enabled)
  const employeeOptions = employees.map((e) => ({
    label: [e.fullName, e.employeeCode].filter(Boolean).join(' · ') || '-',
    value: e.id ?? ''
  }))
  const filterEmployeeItems = [{ label: t('employee.filter.all'), value: '' }, ...employeeOptions]

  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TFilter = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    employeeId: values.employeeId || undefined
  })
  const applied = handleConvertData(urlValues)
  const appliedCount = Object.values(applied).filter(Boolean).length
  const status = tab === EApprovalStatus.All ? undefined : tab
  const params: ITimesheetWeekParams = { ...toApiPaging(), companyId, date: days[0], status, ...applied }

  // API
  const { data: week, isLoading, isFetching } = useTimesheetWeekApi(params, enabled)
  const rows = week?.rows ?? []
  const totalPage = Math.ceil((week?.totalElements ?? 0) / paging.size)

  const { mutate: exportFile, isPending: isExporting } = useMutationApi({
    mutationFn: () =>
      TimesheetService.Export({ companyId, from: days[0], to: days[6], employeeId: applied.employeeId, status }),
    onSuccess: (blob) => commonHelper.downloadBlob(blob, `timesheet-${days[0]}-${days[6]}.xlsx`)
  })

  // Search
  const handleSearch = form.handleSubmit((values) =>
    updateQueries({ ...getSearchPaging(), ...handleConvertData(values) })
  )

  // Reset
  const handleReset = () => {
    form.reset(DEFAULT_VALUES)
    updateQueries({ ...getSearchPaging(), keyword: undefined, employeeId: undefined })
  }

  const goTo = (date: Date) => updateQueries({ date: dateHelper.toApiDate(date), page: getSearchPaging().page })
  const handleTabChange = (next: EApprovalStatus) => updateQueries({ tab: next, page: getSearchPaging().page })

  // Sync data and url
  useEffect(() => {
    setQuery({
      page: searchParams.get('page') ?? undefined,
      size: searchParams.get('size') ?? undefined,
      companyId: searchParams.get('companyId') ?? undefined,
      keyword: searchParams.get('keyword') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      date: searchParams.get('date') || undefined,
      tab
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

  const today = dateHelper.toApiDate(new Date())

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('timesheet.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('timesheet.subtitle')}</p>
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
                <Button
                  className='h-[38px]'
                  onClick={() => {
                    setViewing(false)
                    setEntry({ employeeId: applied.employeeId, date: today })
                  }}
                >
                  <Plus />
                  {t('timesheet.add')}
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
          <form
            className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]'
            onSubmit={(e) => {
              e.preventDefault()
              void handleSearch()
            }}
            noValidate
          >
            <Controller
              name='keyword'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='timesheet-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='timesheet-keyword'
                      placeholder={t('timesheet.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
                </Field>
              )}
            />
            <Controller
              name='employeeId'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='timesheet-employee'>{t('timesheet.field.employee')}</FieldLabel>
                  <Select
                    items={filterEmployeeItems}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? '')}
                  >
                    <SelectTrigger id='timesheet-employee' className='h-[38px] w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterEmployeeItems.map((item) => (
                        <SelectItem key={item.value || 'all'} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <div className='flex items-end gap-2'>
              <Button type='submit' className='h-[38px]'>
                {t('common.search')}
              </Button>
              <Button type='button' variant='outline' className='h-[38px]' onClick={handleReset}>
                {t('company.filter.clear')}
                {appliedCount > 0 && <Badge variant='secondary'>{appliedCount}</Badge>}
              </Button>
            </div>
          </form>

          <TabsCustom
            value={tab}
            onChange={handleTabChange}
            options={DATA.GET_APPROVAL_STATUS_TABS(t, week?.counts)}
            isNoSyncParams
          />

          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              aria-label={t('timesheet.week.previous')}
              onClick={() => goTo(dateHelper.addDays(monday, -7))}
            >
              <ChevronLeft />
            </Button>
            <span className='min-w-48 text-center font-medium' aria-live='polite'>
              {dateHelper.formatDateRange(days[0], days[6])}
            </span>
            <Button
              variant='outline'
              size='icon'
              aria-label={t('timesheet.week.next')}
              onClick={() => goTo(dateHelper.addDays(monday, 7))}
            >
              <ChevronRight />
            </Button>
            <Button variant='ghost' className='h-[38px]' onClick={() => goTo(new Date())}>
              {t('timesheet.week.current')}
            </Button>
          </div>

          <div className='bg-card overflow-x-auto rounded-xl border'>
            <table className='w-full min-w-[56rem] border-collapse text-sm'>
              <thead>
                <tr className='bg-muted/50'>
                  <th scope='col' className='w-56 px-3 py-2 text-left font-medium'>
                    {t('timesheet.field.employee')}
                  </th>
                  {days.map((d) => (
                    <th key={d} scope='col' className='px-2 py-2 text-center font-medium'>
                      {dateHelper.formatIntl(new Date(`${d}T00:00:00`), {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </th>
                  ))}
                  <th scope='col' className='px-3 py-2 text-right font-medium'>
                    {t('attendance_record.field.total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(isLoading || isFetching) && !rows.length
                  ? Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} className='border-t'>
                        <td colSpan={9} className='p-3'>
                          <Skeleton className='h-6 w-full' />
                        </td>
                      </tr>
                    ))
                  : rows.map((row) => {
                      const byDate = new Map((row.days ?? []).map((c) => [c.date, c]))
                      return (
                        <tr key={row.employeeId} className='border-t'>
                          <th scope='row' className='px-3 py-2 text-left font-normal'>
                            <div className='flex items-center gap-2'>
                              <Avatar name={row.fullName} src={row.profileImageUrl} size='sm' />
                              <div className='min-w-0'>
                                <p className='truncate font-medium'>{row.fullName || '-'}</p>
                                <p className='text-muted-foreground truncate text-xs'>{row.designation || '-'}</p>
                              </div>
                            </div>
                          </th>
                          {days.map((d) => {
                            const cell = byDate.get(d)
                            const count = cell?.entries ?? 0
                            return (
                              <td key={d} className='px-2 py-2 text-center align-top'>
                                {count > 0 ? (
                                  <div className='flex flex-col items-center gap-1'>
                                    <span className='font-semibold'>
                                      {t('timesheet.hours_short', { value: commonHelper.formatNumber(cell?.hours, 2) })}
                                    </span>
                                    <button
                                      type='button'
                                      className='text-primary text-xs hover:underline'
                                      aria-label={t('timesheet.view_day', {
                                        name: row.fullName ?? '-',
                                        date: dateHelper.formatDate(d)
                                      })}
                                      onClick={() =>
                                        setDay({ employeeId: row.employeeId, fullName: row.fullName, date: d })
                                      }
                                    >
                                      {t('timesheet.entries', { count })}
                                    </button>
                                    {cell?.status && (
                                      <Badge
                                        variant='outline'
                                        className={cn('text-[11px]', APPROVAL_STATUS_BADGE[cell.status])}
                                      >
                                        {getTranslateEnum(cell.status)}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className='text-muted-foreground'>—</span>
                                )}
                              </td>
                            )
                          })}
                          <td className='px-3 py-2 text-right font-semibold whitespace-nowrap'>
                            {t('timesheet.hours_short', { value: commonHelper.formatNumber(row.total ?? 0, 2) })}
                          </td>
                        </tr>
                      )
                    })}
                {!isLoading && !rows.length && (
                  <tr className='border-t'>
                    <td colSpan={9} className='text-muted-foreground p-8 text-center'>
                      {appliedCount > 0 ? t('saas.empty_filtered') : t('attendance_record.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-muted-foreground text-sm'>
              {t('attendance_record.showing', { count: rows.length, total: week?.totalElements ?? 0 })}
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

      <TimesheetDayDialog
        day={day}
        canManage={canManage}
        onView={(e) => {
          setViewing(true)
          setEntry(e)
        }}
        onEdit={(e) => {
          setViewing(false)
          setEntry(e)
        }}
        onClose={() => setDay(undefined)}
      />
      <TimesheetEntryDialog
        entry={entry}
        employees={employeeOptions}
        readOnly={viewing}
        onClose={() => setEntry(undefined)}
      />
      <ImportDialog
        open={importing}
        companyId={companyId}
        title={t('timesheet.import.title')}
        description={t('timesheet.import.description')}
        templateName='timesheet-import-template.xlsx'
        getTemplate={TimesheetService.GetImportTemplate}
        importFile={TimesheetService.Import}
        onClose={() => setImporting(false)}
      />
    </PageLayout>
  )
}
