import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import { companyMgtColumn, type TCompanyAction } from '~/helpers/columns/company-mgt-column'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getCompanyFilterSchema, type TCompanyFilterSchema } from '~/helpers/schema.helper'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import {
  useGetCompanyStatusCountsApi,
  useGetListCompanyApi,
  useInvalidateCompanies
} from '~/hooks/apis/use-company-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { CompanyService } from '~/services/company.service'
import { DATA } from '~/shared/constants/data.constant'
import { ECompanyStatus } from '~/shared/enums/company.enum'
import { ECompanyFilterFormKey } from '~/shared/enums/form.enum'
import type { ICompany, ICompanyCreated, ICompanyListParams } from '~/shared/models/company.model'

import { CompanyFilterBar } from './components/company-filter-bar'
import { CompanyInfoSheet } from './components/company-info-sheet'
import { CreateCompanyDialog } from './components/create-company-dialog'
import { EditCompanyDialog } from './components/edit-company-dialog'
import { ResetPasswordDialog } from './components/reset-password-dialog'
import { TemporaryPasswordDialog } from './components/temporary-password-dialog'
import { UpgradePlanDialog } from './components/upgrade-plan-dialog'

const DEFAULT_VALUES: TCompanyFilterSchema = {
  [ECompanyFilterFormKey.Keyword]: '',
  [ECompanyFilterFormKey.CreatedFrom]: '',
  [ECompanyFilterFormKey.CreatedTo]: ''
}

export function meta() {
  return [{ title: 'Companies · SPECOM HRM' }]
}

// Manual 3.2.1 Companies Management (Super Admin). Spec: IAM CompanyController (all endpoints superAdmin only)
export default function CompaniesPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { data: me, isLoading: isMeLoading } = useMeApi()
  const isSuperAdmin = !!me?.superAdmin
  const invalidate = useInvalidateCompanies()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const [tab, setTab] = useState<ECompanyStatus>(() => paramsHelper.getCompanyTab(searchParams))

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [dialog, setDialog] = useState<{ type: TCompanyAction; company: ICompany } | null>(null)
  const [created, setCreated] = useState<ICompanyCreated | undefined>()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const columns = useMemo(
    () => companyMgtColumn.getCompany(t, getTranslateEnum, (type, company) => setDialog({ type, company })),
    [t, getTranslateEnum]
  )

  // Form
  const form = useForm<TCompanyFilterSchema>({
    defaultValues: formHelper.getDefaultValues(searchParams, DEFAULT_VALUES),
    resolver: zodResolver(getCompanyFilterSchema(t)),
    mode: 'all'
  })

  // Convert data — the URL is the source of truth for the request (so F5 / back keeps the list)
  const handleConvertData = (values: TCompanyFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    createdFrom: values.createdFrom || undefined,
    createdTo: values.createdTo || undefined
  })
  const appliedFilters = handleConvertData(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  const appliedCount = Object.values(appliedFilters).filter(Boolean).length
  const listParams: ICompanyListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // TODO: send ALL once BE supports it — the `status` param only accepts ACTIVE | SUSPENDED (omitted = All)
    status: tab === ECompanyStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListCompanyApi({
    params: listParams,
    enabled: isSuperAdmin
  })
  const { data: counts } = useGetCompanyStatusCountsApi(appliedFilters, isSuperAdmin)

  const { mutate: changeStatus, isPending: isChangingStatus } = useMutationApi({
    mutationFn: (company: ICompany) =>
      CompanyService.ChangeStatus(
        company.id ?? '',
        company.status === ECompanyStatus.Active ? ECompanyStatus.Suspended : ECompanyStatus.Active
      ),
    onSuccess: async (res) => {
      toast.success(
        t(res?.data?.status === ECompanyStatus.Active ? 'company.toast.login_enabled' : 'company.toast.login_disabled')
      )
      await invalidate()
      setDialog(null)
    }
  })

  const { mutate: deleteCompany, isPending: isDeleting } = useMutationApi({
    mutationFn: (company: ICompany) => CompanyService.Delete(company.id ?? ''),
    onSuccess: async () => {
      toast.success(t('company.toast.deleted'))
      await invalidate()
      setDialog(null)
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
    updateQueries({ ...getResetPaging(), ...DEFAULT_VALUES })
  }

  // One URL update: two back-to-back setSearchParams calls overwrite each other (the tab was lost)
  const handleTabChange = (next: ECompanyStatus) => {
    setTab(next)
    updateQueries({ tab: next, page: getSearchPaging().page })
  }

  // Sync data and url — values already in the URL win over defaults
  useEffect(() => {
    setQuery(paramsHelper.companyToSearchParams(searchParams, DEFAULT_VALUES, tab))
  }, [])

  if (!isMeLoading && !isSuperAdmin) {
    return (
      <PageLayout>
        <div className='bg-card text-muted-foreground flex flex-col items-center gap-2 rounded-xl border p-10 text-center'>
          <ShieldAlert className='size-8' />
          <p>{t('common.no_permission')}</p>
        </div>
      </PageLayout>
    )
  }

  const target = dialog?.company
  const isActiveTarget = target?.status === ECompanyStatus.Active

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('company.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('company.subtitle')}</p>
        </div>
        <Button className='h-[38px]' onClick={() => setIsCreateOpen(true)}>
          <Plus />
          {t('company.create.button')}
        </Button>
      </div>

      <CompanyFilterBar form={form} appliedCount={appliedCount} onSearch={handleSearch} onReset={handleReset} />

      <TabsCustom
        value={tab}
        onChange={handleTabChange}
        options={DATA.GET_COMPANY_STATUS_TABS(t, counts)}
        isNoSyncParams
      />

      <TableCustom
        columns={columns}
        data={dataList}
        loading={isLoading || isRefetching || isMeLoading}
        totalItems={totalElement}
        page={paging.page}
        size={paging.size}
        totalPage={totalPage}
        onPageChange={setPage}
        onSizeChange={setSize}
        disableNavigationAll
        emptyText={appliedCount > 0 ? t('company.empty_filtered') : t('company.empty')}
      />

      <CreateCompanyDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={setCreated} />
      <TemporaryPasswordDialog created={created} onClose={() => setCreated(undefined)} />
      <CompanyInfoSheet company={dialog?.type === 'info' ? target : undefined} onClose={() => setDialog(null)} />
      <EditCompanyDialog company={dialog?.type === 'edit' ? target : undefined} onClose={() => setDialog(null)} />
      <UpgradePlanDialog company={dialog?.type === 'upgrade' ? target : undefined} onClose={() => setDialog(null)} />
      <ResetPasswordDialog
        company={dialog?.type === 'reset-password' ? target : undefined}
        onClose={() => setDialog(null)}
      />
      <AlertDialogCustom
        open={dialog?.type === 'toggle-status'}
        onOpenChange={(open) => !open && !isChangingStatus && setDialog(null)}
        title={t(isActiveTarget ? 'company.status.disable_title' : 'company.status.enable_title')}
        description={t(isActiveTarget ? 'company.status.disable_description' : 'company.status.enable_description', {
          name: target?.name ?? '-'
        })}
        confirmText={t(isActiveTarget ? 'company.action.disable_login' : 'company.action.enable_login')}
        isDestructive={isActiveTarget}
        loading={isChangingStatus}
        onConfirm={() => target && changeStatus(target)}
      />
      <AlertDialogCustom
        open={dialog?.type === 'delete'}
        onOpenChange={(open) => !open && !isDeleting && setDialog(null)}
        title={t('company.delete.title')}
        description={t('company.delete.description', { name: target?.name ?? '-' })}
        confirmText={t('company.action.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => target && deleteCompany(target)}
      />
    </PageLayout>
  )
}
