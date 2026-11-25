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
import { attendanceMgtColumn } from '~/helpers/columns/attendance-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import {
  useAttendancePolicyCountsApi,
  useAttendancePolicySummaryApi,
  useGetListAttendancePolicyApi,
  useInvalidateAttendance
} from '~/hooks/apis/use-attendance-api'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { AttendancePolicyService } from '~/services/attendance.service'
import { DATA } from '~/shared/constants/data.constant'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IAttendancePolicy, IAttendancePolicyListParams } from '~/shared/models/attendance.model'

import { AttendancePolicyFormDialog } from './components/attendance-policy-form-dialog'

const DEFAULT_VALUES: TKeywordFilterSchema = { keyword: '' }

export function meta() {
  return [{ title: 'Attendance policies · SPECOM HRM' }]
}

// Manual 6.4.6 Attendance Policies. Spec: GET /attendance/policies (+ /status-counts, /summary)
export default function AttendancePoliciesPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateAttendance()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ATTENDANCE_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ATTENDANCE_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()
  const { data: currency } = useDefaultCurrencyApi()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const tab = commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EOrgStatus), EOrgStatus.All)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [formPolicy, setFormPolicy] = useState<IAttendancePolicy | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IAttendancePolicy | undefined>()

  const {
    mutate: toggle,
    variables: toggling,
    isPending: isToggling
  } = useMutationApi({
    mutationFn: ({ policy, active }: { policy: IAttendancePolicy; active: boolean }) =>
      AttendancePolicyService.UpdateStatus(policy.id ?? '', active ? EOrgStatus.Active : EOrgStatus.Inactive),
    onSuccess: async (_, { active }) => {
      toast.success(t(active ? 'attendance_policy.toast.activated' : 'attendance_policy.toast.deactivated'))
      await invalidate()
    }
  })

  const columns = useMemo(
    () =>
      attendanceMgtColumn.getAttendancePolicy(
        t,
        getTranslateEnum,
        {
          onAction: (action, policy) => (action === 'edit' ? setFormPolicy(policy) : setDeleting(policy)),
          onToggle: (policy, active) => toggle({ policy, active }),
          canManage,
          togglingId: isToggling ? toggling?.policy.id : undefined
        },
        currency
      ),
    [t, getTranslateEnum, toggle, toggling, isToggling, canManage, currency]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TKeywordFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getKeywordFilterSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TKeywordFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined
  })
  const appliedFilters: IAttendancePolicyListParams = { companyId, ...handleConvertData(urlValues) }
  const appliedCount = handleConvertData(urlValues).keyword ? 1 : 0
  const listParams: IAttendancePolicyListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    status: tab === EOrgStatus.All ? undefined : tab
  }

  // API
  const enabled = isReady && canView
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListAttendancePolicyApi({
    params: listParams,
    enabled
  })
  const { data: counts } = useAttendancePolicyCountsApi(appliedFilters, enabled)
  const { data: summary, isLoading: isLoadingSummary } = useAttendancePolicySummaryApi(companyId, enabled)

  const { mutate: deletePolicy, isPending: isDeleting } = useMutationApi({
    mutationFn: (policy: IAttendancePolicy) => AttendancePolicyService.Delete(policy.id ?? ''),
    onSuccess: async () => {
      toast.success(t('attendance_policy.toast.deleted'))
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
    updateQueries({ ...getResetPaging(), keyword: undefined })
  }

  const handleTabChange = (next: EOrgStatus) => updateQueries({ tab: next, page: getSearchPaging().page })

  // Sync data and url
  useEffect(() => {
    setQuery({
      ...paramsHelper.keywordToSearchParams(searchParams, tab),
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
          <h1 className='text-xl font-semibold'>{t('attendance_policy.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('attendance_policy.subtitle')}</p>
        </div>
        {isReady && canManage && (
          <Button className='h-[38px]' onClick={() => setFormPolicy(null)}>
            <Plus />
            {t('attendance_policy.add')}
          </Button>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('attendance.pick_company')} />
      ) : (
        <>
          <StatCards
            label={t('attendance_policy.summary.title')}
            items={DATA.GET_ATTENDANCE_POLICY_SUMMARY_CARDS(t, summary, currency)}
            loading={isLoadingSummary}
          />

          <form
            className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_auto]'
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
                  <FieldLabel htmlFor='policy-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='policy-keyword'
                      placeholder={t('attendance_policy.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
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
            emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('attendance_policy.empty')}
          />
        </>
      )}

      <AttendancePolicyFormDialog
        policy={formPolicy}
        companyId={companyId}
        currencySymbol={currency?.symbol ?? currency?.code}
        onClose={() => setFormPolicy(undefined)}
      />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('attendance_policy.delete.title', { name: deleting?.name ?? '-' })}
        description={t('attendance_policy.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deletePolicy(deleting)}
      />
    </PageLayout>
  )
}
