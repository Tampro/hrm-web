import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { StatCards } from '~/components/customs/stat-cards'
import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { attendanceMgtColumn } from '~/helpers/columns/attendance-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getShiftFilterSchema, type TShiftFilterSchema } from '~/helpers/schemas/attendance.schema'
import {
  useGetListShiftApi,
  useInvalidateAttendance,
  useShiftCountsApi,
  useShiftSummaryApi
} from '~/hooks/apis/use-attendance-api'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { ShiftService } from '~/services/attendance.service'
import { DATA } from '~/shared/constants/data.constant'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IShift, IShiftListParams } from '~/shared/models/attendance.model'

import { ShiftFormDialog } from './components/shift-form-dialog'

const DEFAULT_VALUES: TShiftFilterSchema = { keyword: '', nightShift: '' }

export function meta() {
  return [{ title: 'Shifts · SPECOM HRM' }]
}

// Manual 6.4.5 Shifts. Spec: GET /attendance/shifts (+ /status-counts, /summary)
export default function ShiftsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateAttendance()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ATTENDANCE_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ATTENDANCE_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const tab = commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EOrgStatus), EOrgStatus.All)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [formShift, setFormShift] = useState<IShift | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IShift | undefined>()

  const { mutate: toggle, variables: toggling } = useMutationApi({
    mutationFn: ({ shift, active }: { shift: IShift; active: boolean }) =>
      ShiftService.UpdateStatus(shift.id ?? '', active ? EOrgStatus.Active : EOrgStatus.Inactive),
    onSuccess: async (_, { active }) => {
      toast.success(t(active ? 'shift.toast.activated' : 'shift.toast.deactivated'))
      await invalidate()
    }
  })

  const columns = useMemo(
    () =>
      attendanceMgtColumn.getShift(t, getTranslateEnum, {
        onAction: (action, shift) => (action === 'edit' ? setFormShift(shift) : setDeleting(shift)),
        onToggle: (shift, active) => toggle({ shift, active }),
        canManage,
        togglingId: toggling?.shift.id
      }),
    [t, getTranslateEnum, toggle, toggling, canManage]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TShiftFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getShiftFilterSchema(t)),
    mode: 'all'
  })
  const typeItems = DATA.GET_SHIFT_TYPE_OPTIONS(t)

  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TShiftFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    nightShift: values.nightShift || undefined
  })
  const converted = handleConvertData(urlValues)
  const appliedFilters: IShiftListParams = {
    companyId,
    keyword: converted.keyword,
    nightShift: converted.nightShift === undefined ? undefined : converted.nightShift === 'true'
  }
  const appliedCount = Object.values(converted).filter(Boolean).length
  const listParams: IShiftListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    status: tab === EOrgStatus.All ? undefined : tab
  }

  // API
  const enabled = isReady && canView
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListShiftApi({
    params: listParams,
    enabled
  })
  const { data: counts } = useShiftCountsApi(appliedFilters, enabled)
  const { data: summary, isLoading: isLoadingSummary } = useShiftSummaryApi(companyId, enabled)

  const { mutate: deleteShift, isPending: isDeleting } = useMutationApi({
    mutationFn: (shift: IShift) => ShiftService.Delete(shift.id ?? ''),
    onSuccess: async () => {
      toast.success(t('shift.toast.deleted'))
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
    updateQueries({ ...getResetPaging(), keyword: undefined, nightShift: undefined })
  }

  const handleTabChange = (next: EOrgStatus) => updateQueries({ tab: next, page: getSearchPaging().page })

  // Sync data and url
  useEffect(() => {
    setQuery({
      ...paramsHelper.keywordToSearchParams(searchParams, tab),
      nightShift: searchParams.get('nightShift') || undefined,
      companyId: searchParams.get('companyId') ?? undefined
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

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('shift.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('shift.subtitle')}</p>
        </div>
        {isReady && canManage && (
          <Button className='h-[38px]' onClick={() => setFormShift(null)}>
            <Plus />
            {t('shift.add')}
          </Button>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('attendance.pick_company')} />
      ) : (
        <>
          <StatCards
            label={t('shift.summary.title')}
            items={DATA.GET_SHIFT_SUMMARY_CARDS(t, summary)}
            loading={isLoadingSummary}
          />

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
                  <FieldLabel htmlFor='shift-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='shift-keyword'
                      placeholder={t('shift.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
                </Field>
              )}
            />
            <Controller
              name='nightShift'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='shift-type'>{t('shift.filter.type')}</FieldLabel>
                  <Select items={typeItems} value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger id='shift-type' className='h-[38px] w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeItems.map((item) => (
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
              </Button>
            </div>
          </form>

          <TabsCustom
            value={tab}
            onChange={handleTabChange}
            options={DATA.GET_ORG_STATUS_TABS(t, counts)}
            isNoSyncParams
          />

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
            emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('shift.empty')}
          />
        </>
      )}

      <ShiftFormDialog shift={formShift} companyId={companyId} onClose={() => setFormShift(undefined)} />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('shift.delete.title', { name: deleting?.name ?? '-' })}
        description={t('shift.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteShift(deleting)}
      />
    </PageLayout>
  )
}
