import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, FileDown, List, Plus, Search, ShieldAlert, Tags } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { getHolidayCategoryName, holidayMgtColumn, type THolidayAction } from '~/helpers/columns/holiday-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getHolidayFilterSchema, type THolidayFilterSchema } from '~/helpers/schemas/holiday.schema'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useGetListHolidayApi, useHolidayCategoriesApi, useInvalidateHolidays } from '~/hooks/apis/use-holiday-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { HolidayService } from '~/services/holiday.service'
import { DATA } from '~/shared/constants/data.constant'
import { EHolidayFilterFormKey } from '~/shared/enums/form.enum'
import { EHolidayView } from '~/shared/enums/holiday.enum'
import type { IHoliday, IHolidayListParams } from '~/shared/models/holiday.model'

import { HolidayCalendar } from './components/holiday-calendar'
import { HolidayCategoryDialog } from './components/holiday-category-dialog'
import { HolidayDetailSheet } from './components/holiday-detail-sheet'
import { HolidayFormDialog } from './components/holiday-form-dialog'

const DEFAULT_VALUES: THolidayFilterSchema = {
  [EHolidayFilterFormKey.Keyword]: '',
  [EHolidayFilterFormKey.CategoryId]: '',
  [EHolidayFilterFormKey.Year]: '',
  [EHolidayFilterFormKey.DateFrom]: '',
  [EHolidayFilterFormKey.DateTo]: ''
}

export function meta() {
  return [{ title: 'Holidays · SPECOM HRM' }]
}

// Manual 6.3.4 Holidays: list + Calendar View, Export PDF / iCal, Add Holiday.
// Spec: GET /org/holidays (keyword, categoryId, year, dateFrom, dateTo; sort by startDate)
export default function HolidaysPage() {
  // Lib
  const { t } = useTranslation()
  const invalidate = useInvalidateHolidays()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ORG_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ORG_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()
  const enabled = isReady && canView
  const [exporting, setExporting] = useState<'pdf' | 'ical' | undefined>()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const view = commonHelper.toEnumValue(searchParams.get('view'), Object.values(EHolidayView), EHolidayView.List)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [viewingId, setViewingId] = useState<string | undefined>()
  const [formHoliday, setFormHoliday] = useState<IHoliday | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IHoliday | undefined>()
  const columns = useMemo(
    () =>
      holidayMgtColumn.getHoliday(
        t,
        (action: THolidayAction, holiday) => {
          if (action === 'view') setViewingId(holiday.id)
          else if (action === 'edit') setFormHoliday(holiday)
          else setDeleting(holiday)
        },
        canManage
      ),
    [t, canManage]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<THolidayFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getHolidayFilterSchema(t)),
    mode: 'all'
  })
  const { data: categories = [] } = useHolidayCategoriesApi(companyId, enabled)
  const categoryItems = [
    { label: t('employee.filter.all'), value: '' },
    ...categories.map((c) => ({ label: getHolidayCategoryName(t, c), value: c.id ?? '' }))
  ]
  const yearItems = DATA.GET_HOLIDAY_YEAR_OPTIONS(t)

  // the picker changes ?companyId= and drops the filters: start the form over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: THolidayFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    categoryId: values.categoryId || undefined,
    year: values.year ? Number(values.year) : undefined,
    dateFrom: values.dateFrom || undefined,
    dateTo: values.dateTo || undefined
  })
  const appliedFilters = handleConvertData(urlValues)
  // Manual: the Filters badge shows how many filters are applied
  const appliedCount = Object.values(appliedFilters).filter((v) => v !== undefined).length
  const listParams: IHolidayListParams = { ...toApiPaging(), sort: 'startDate,asc', companyId, ...appliedFilters }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListHolidayApi({
    params: listParams,
    enabled: enabled && view === EHolidayView.List
  })

  const { mutate: deleteHoliday, isPending: isDeleting } = useMutationApi({
    mutationFn: (holiday: IHoliday) => HolidayService.Delete(holiday.id ?? ''),
    onSuccess: async () => {
      toast.success(t('holiday.toast.deleted'))
      await invalidate()
      setDeleting(undefined)
    }
  })

  // Spec: both exports take the list filters (PDF up to 1000 rows; iCal = all-day events)
  const handleExport = async (kind: 'pdf' | 'ical') => {
    setExporting(kind)
    try {
      const params = { companyId, ...appliedFilters }
      const blob = kind === 'pdf' ? await HolidayService.ExportPdf(params) : await HolidayService.ExportIcal(params)
      commonHelper.downloadBlob(blob, kind === 'pdf' ? 'holidays.pdf' : 'holidays.ics')
    } catch {
      // axiosClient already showed the error toast
    } finally {
      setExporting(undefined)
    }
  }

  // Search
  const handleSearch = form.handleSubmit((values) =>
    updateQueries({ ...getSearchPaging(), ...handleConvertData(values) })
  )

  // Reset
  const handleReset = () => {
    form.reset(DEFAULT_VALUES)
    resetPaging()
    updateQueries({
      ...getResetPaging(),
      keyword: undefined,
      categoryId: undefined,
      year: undefined,
      dateFrom: undefined,
      dateTo: undefined
    })
  }

  // Sync data and url (companyId straight from the URL: /me may not be loaded yet on mount)
  useEffect(() => {
    setQuery(
      paramsHelper.holidayToSearchParams(searchParams, DEFAULT_VALUES, view, searchParams.get('companyId') ?? undefined)
    )
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

  const selectFilter = (name: EHolidayFilterFormKey, label: string, items: { label: string; value: string }[]) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={`holiday-filter-${name}`}>{label}</FieldLabel>
          <Select items={items} value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
            <SelectTrigger id={`holiday-filter-${name}`} className='h-[38px] w-full'>
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

  const dateFilter = (name: EHolidayFilterFormKey, label: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`holiday-filter-${name}`}>{label}</FieldLabel>
          <DatePickerCustom
            id={`holiday-filter-${name}`}
            value={field.value}
            onChange={(value) => {
              field.onChange(value)
              void form.trigger(EHolidayFilterFormKey.DateTo)
            }}
            isInvalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('holiday.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('holiday.subtitle')}</p>
        </div>
        {isReady && (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              className='h-[38px]'
              onClick={() =>
                updateQueries({ view: view === EHolidayView.List ? EHolidayView.Calendar : EHolidayView.List })
              }
            >
              {view === EHolidayView.List ? <CalendarDays /> : <List />}
              {t(view === EHolidayView.List ? 'holiday.view.calendar' : 'holiday.view.list')}
            </Button>
            <Button
              variant='outline'
              className='h-[38px]'
              disabled={!!exporting}
              onClick={() => void handleExport('pdf')}
            >
              <FileDown />
              {exporting === 'pdf' ? t('holiday.export.exporting') : t('holiday.export.pdf')}
            </Button>
            <Button
              variant='outline'
              className='h-[38px]'
              disabled={!!exporting}
              onClick={() => void handleExport('ical')}
            >
              <FileDown />
              {exporting === 'ical' ? t('holiday.export.exporting') : t('holiday.export.ical')}
            </Button>
            {canManage && (
              <>
                <Button variant='outline' className='h-[38px]' onClick={() => setIsCategoryOpen(true)}>
                  <Tags />
                  {t('holiday.category.open')}
                </Button>
                <Button className='h-[38px]' onClick={() => setFormHoliday(null)}>
                  <Plus />
                  {t('holiday.add')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('holiday.pick_company')} />
      ) : view === EHolidayView.Calendar ? (
        <HolidayCalendar companyId={companyId} categories={categories} onOpen={(h) => setViewingId(h.id)} />
      ) : (
        <>
          <form
            aria-label={t('holiday.filter.title')}
            className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]'
            onSubmit={(e) => {
              e.preventDefault()
              void handleSearch()
            }}
            noValidate
          >
            <Controller
              name={EHolidayFilterFormKey.Keyword}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='holiday-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='holiday-keyword'
                      placeholder={t('holiday.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
                </Field>
              )}
            />
            {selectFilter(EHolidayFilterFormKey.CategoryId, t('holiday.field.category'), categoryItems)}
            {selectFilter(EHolidayFilterFormKey.Year, t('holiday.filter.year'), yearItems)}
            {dateFilter(EHolidayFilterFormKey.DateFrom, t('saas.filter.date_from'))}
            {dateFilter(EHolidayFilterFormKey.DateTo, t('saas.filter.date_to'))}
            <div className='flex items-end gap-2'>
              <Button type='submit' className='h-[38px]'>
                {t('common.search')}
              </Button>
              <Button type='button' variant='outline' className='h-[38px]' onClick={handleReset}>
                {t('company.filter.clear')}
                {appliedCount > 0 && (
                  <Badge aria-label={t('holiday.filter.applied', { count: appliedCount })}>{appliedCount}</Badge>
                )}
              </Button>
            </div>
          </form>

          <TableCustom
            columns={columns}
            data={dataList}
            loading={isLoading || isRefetching}
            totalItems={totalElement}
            page={paging.page}
            size={paging.size}
            totalPage={totalPage}
            onPageChange={setPage}
            onSizeChange={setSize}
            disableNavigationAll
            emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('holiday.empty')}
          />
        </>
      )}

      <HolidayDetailSheet holidayId={viewingId} onClose={() => setViewingId(undefined)} />
      <HolidayFormDialog holiday={formHoliday} companyId={companyId} onClose={() => setFormHoliday(undefined)} />
      <HolidayCategoryDialog open={isCategoryOpen} companyId={companyId} onClose={() => setIsCategoryOpen(false)} />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('holiday.delete.title', { name: deleting?.name ?? '-' })}
        description={t('holiday.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteHoliday(deleting)}
      />
    </PageLayout>
  )
}
