import { zodResolver } from '@hookform/resolvers/zod'
import { LayoutGrid, List, Plus, Search, ShieldAlert, Tags } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { PaginationCustom } from '~/components/customs/pagination-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import {
  announcementMgtColumn,
  getAnnouncementCategoryName,
  type TAnnouncementAction
} from '~/helpers/columns/announcement-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getAnnouncementFilterSchema, type TAnnouncementFilterSchema } from '~/helpers/schemas/announcement.schema'
import {
  useAnnouncementCategoriesApi,
  useAnnouncementTabCountsApi,
  useGetAnnouncementDetailApi,
  useGetListAnnouncementApi,
  useInvalidateAnnouncements
} from '~/hooks/apis/use-announcement-api'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useBranchOptionsApi } from '~/hooks/apis/use-employee-api'
import { useDepartmentChoicesApi } from '~/hooks/apis/use-org-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { AnnouncementService } from '~/services/announcement.service'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EAnnouncementTab, EAnnouncementView } from '~/shared/enums/announcement.enum'
import { EAnnouncementFilterFormKey } from '~/shared/enums/form.enum'
import type { IAnnouncement, IAnnouncementListParams } from '~/shared/models/announcement.model'

import { AnnouncementCard } from './components/announcement-card'
import { AnnouncementCategoryDialog } from './components/announcement-category-dialog'
import { AnnouncementFormDialog } from './components/announcement-form-dialog'

const DEFAULT_VALUES: TAnnouncementFilterSchema = {
  [EAnnouncementFilterFormKey.Keyword]: '',
  [EAnnouncementFilterFormKey.CategoryId]: '',
  [EAnnouncementFilterFormKey.BranchId]: '',
  [EAnnouncementFilterFormKey.DepartmentId]: '',
  [EAnnouncementFilterFormKey.DateFrom]: '',
  [EAnnouncementFilterFormKey.DateTo]: ''
}

export function meta() {
  return [{ title: 'Announcements · SPECOM HRM' }]
}

// Manual 6.3.5 Announcements: list + Dashboard View (tabs), filters, Add Announcement, categories.
// Spec: GET /org/announcements (+ /tab-counts with the same filters), ANNOUNCEMENT_VIEW / ANNOUNCEMENT_MANAGE
export default function AnnouncementsPage() {
  // Lib
  const { t } = useTranslation()
  const navigate = useNavigate()
  const invalidate = useInvalidateAnnouncements()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ANNOUNCEMENT_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ANNOUNCEMENT_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()
  const enabled = isReady && canView
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const view = commonHelper.toEnumValue(
    searchParams.get('view'),
    Object.values(EAnnouncementView),
    EAnnouncementView.List
  )
  const tab = commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EAnnouncementTab), EAnnouncementTab.All)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<IAnnouncement | undefined>()
  // edit needs the full content and attachments: only the detail has them
  const { detail: editing } = useGetAnnouncementDetailApi({ id: editingId })
  const columns = useMemo(
    () =>
      announcementMgtColumn.getAnnouncement(
        t,
        (action: TAnnouncementAction, a) => {
          if (action === 'view') navigate(ROUTES.ANNOUNCEMENT_DETAIL(a.id ?? ''))
          else if (action === 'statistics') navigate(ROUTES.ANNOUNCEMENT_STATISTICS(a.id ?? ''))
          else if (action === 'edit') setEditingId(a.id)
          else setDeleting(a)
        },
        canManage
      ),
    [t, canManage, navigate]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TAnnouncementFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getAnnouncementFilterSchema(t)),
    mode: 'all'
  })
  const all = { label: t('employee.filter.all'), value: '' }
  const { data: categories = [] } = useAnnouncementCategoriesApi(companyId, enabled)
  const { data: branches = [] } = useBranchOptionsApi(companyId, enabled)
  const departments = useDepartmentChoicesApi(companyId, enabled)
  const categoryItems = [
    all,
    ...categories.map((c) => ({ label: getAnnouncementCategoryName(t, c), value: c.id ?? '' }))
  ]
  const branchItems = [all, ...branches.map((b) => ({ label: b.name ?? '-', value: b.id ?? '' }))]
  const departmentItems = [all, ...departments]

  // the picker changes ?companyId= and drops the filters: start the form over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TAnnouncementFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    categoryId: values.categoryId || undefined,
    branchId: values.branchId || undefined,
    departmentId: values.departmentId || undefined,
    dateFrom: values.dateFrom || undefined,
    dateTo: values.dateTo || undefined
  })
  const appliedFilters = { companyId, ...handleConvertData(urlValues) }
  const appliedCount = Object.values(handleConvertData(urlValues)).filter(Boolean).length
  const listParams: IAnnouncementListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // Spec: ETab includes ALL; only the dashboard narrows by tab
    tab: view === EAnnouncementView.Dashboard ? tab : undefined
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListAnnouncementApi({
    params: listParams,
    enabled
  })
  const { data: counts } = useAnnouncementTabCountsApi(appliedFilters, enabled && view === EAnnouncementView.Dashboard)

  const { mutate: deleteAnnouncement, isPending: isDeleting } = useMutationApi({
    mutationFn: (a: IAnnouncement) => AnnouncementService.Delete(a.id ?? ''),
    onSuccess: async () => {
      toast.success(t('announcement.toast.deleted'))
      await invalidate()
      setDeleting(undefined)
    }
  })

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
      branchId: undefined,
      departmentId: undefined,
      dateFrom: undefined,
      dateTo: undefined
    })
  }

  // Sync data and url (companyId straight from the URL: /me may not be loaded yet on mount)
  useEffect(() => {
    setQuery(
      paramsHelper.announcementToSearchParams(
        searchParams,
        DEFAULT_VALUES,
        view,
        tab,
        searchParams.get('companyId') ?? undefined
      )
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

  const selectFilter = (name: EAnnouncementFilterFormKey, label: string, items: { label: string; value: string }[]) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={`announcement-filter-${name}`}>{label}</FieldLabel>
          <Select items={items} value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
            <SelectTrigger id={`announcement-filter-${name}`} className='h-[38px] w-full'>
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

  const dateFilter = (name: EAnnouncementFilterFormKey, label: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`announcement-filter-${name}`}>{label}</FieldLabel>
          <DatePickerCustom
            id={`announcement-filter-${name}`}
            value={field.value}
            onChange={(value) => {
              field.onChange(value)
              void form.trigger(EAnnouncementFilterFormKey.DateTo)
            }}
            isInvalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )

  const views = [
    { value: EAnnouncementView.List, label: t('announcement.view.list'), icon: <List /> },
    { value: EAnnouncementView.Dashboard, label: t('announcement.view.dashboard'), icon: <LayoutGrid /> }
  ]

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('announcement.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('announcement.subtitle')}</p>
        </div>
        {isReady && (
          <div className='flex flex-wrap items-center gap-2'>
            <div role='group' aria-label={t('announcement.view.label')} className='bg-muted flex rounded-lg p-1'>
              {views.map((v) => (
                <Button
                  key={v.value}
                  variant={view === v.value ? 'default' : 'ghost'}
                  className='h-[30px]'
                  aria-pressed={view === v.value}
                  onClick={() => updateQueries({ view: v.value, page: getSearchPaging().page })}
                >
                  {v.icon}
                  {v.label}
                </Button>
              ))}
            </div>
            {canManage && (
              <>
                <Button variant='outline' className='h-[38px]' onClick={() => setIsCategoryOpen(true)}>
                  <Tags />
                  {t('announcement.category.open')}
                </Button>
                <Button className='h-[38px]' onClick={() => setCreating(true)}>
                  <Plus />
                  {t('announcement.add')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('announcement.pick_company')} />
      ) : (
        <>
          <form
            aria-label={t('announcement.filter.title')}
            className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_auto]'
            onSubmit={(e) => {
              e.preventDefault()
              void handleSearch()
            }}
            noValidate
          >
            <Controller
              name={EAnnouncementFilterFormKey.Keyword}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='announcement-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='announcement-keyword'
                      placeholder={t('announcement.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
                </Field>
              )}
            />
            {selectFilter(EAnnouncementFilterFormKey.CategoryId, t('announcement.field.category'), categoryItems)}
            {selectFilter(EAnnouncementFilterFormKey.BranchId, t('announcement.filter.branch'), branchItems)}
            {selectFilter(
              EAnnouncementFilterFormKey.DepartmentId,
              t('announcement.filter.department'),
              departmentItems
            )}
            {dateFilter(EAnnouncementFilterFormKey.DateFrom, t('saas.filter.date_from'))}
            {dateFilter(EAnnouncementFilterFormKey.DateTo, t('saas.filter.date_to'))}
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

          {view === EAnnouncementView.Dashboard ? (
            <>
              <TabsCustom
                value={tab}
                onChange={(next) => updateQueries({ tab: next, page: getSearchPaging().page })}
                options={DATA.GET_ANNOUNCEMENT_TABS(t, counts)}
                isNoSyncParams
              />
              {isLoading ? (
                <Skeleton className='h-64 w-full' />
              ) : dataList.length ? (
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                  {dataList.map((a) => (
                    <AnnouncementCard key={a.id} announcement={a} />
                  ))}
                </div>
              ) : (
                <p className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>
                  {appliedCount > 0 ? t('saas.empty_filtered') : t('announcement.empty')}
                </p>
              )}
              {totalPage > 1 && (
                <PaginationCustom
                  page={paging.page}
                  size={paging.size}
                  totalPage={totalPage}
                  onPageChange={setPage}
                  onSizeChange={setSize}
                />
              )}
            </>
          ) : (
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
              emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('announcement.empty')}
            />
          )}
        </>
      )}

      <AnnouncementFormDialog
        announcement={creating ? null : editingId ? editing : undefined}
        companyId={companyId}
        onClose={() => {
          setCreating(false)
          setEditingId(undefined)
        }}
      />
      <AnnouncementCategoryDialog
        open={isCategoryOpen}
        companyId={companyId}
        onClose={() => setIsCategoryOpen(false)}
      />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('announcement.delete.title', { name: deleting?.title ?? '-' })}
        description={t('announcement.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteAnnouncement(deleting)}
      />
    </PageLayout>
  )
}
