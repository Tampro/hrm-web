import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { orgMgtColumn, type TBranchAction } from '~/helpers/columns/org-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useGetListBranchApi, useInvalidateBranches } from '~/hooks/apis/use-org-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { BranchService } from '~/services/org.service'
import { DATA } from '~/shared/constants/data.constant'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IBranch, IBranchListParams } from '~/shared/models/org.model'

import { BranchDetailSheet } from './components/branch-detail-sheet'
import { BranchFormDialog } from './components/branch-form-dialog'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

export function meta() {
  return [{ title: 'Branches · SPECOM HRM' }]
}

// Manual 6.2 Branches. Spec: GET /org/branches (keyword matches name, email or phone; status ACTIVE | INACTIVE)
export default function BranchesPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateBranches()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ORG_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ORG_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  // the tab lives in the URL only, so the company picker (which rewrites the URL) resets it too
  const tab = commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EOrgStatus), EOrgStatus.All)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [viewingId, setViewingId] = useState<string | undefined>()
  const [formBranch, setFormBranch] = useState<IBranch | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IBranch | undefined>()

  const { mutate: toggle, variables: toggling } = useMutationApi({
    mutationFn: ({ branch, active }: { branch: IBranch; active: boolean }) =>
      BranchService.UpdateStatus(branch.id ?? '', active ? EOrgStatus.Active : EOrgStatus.Inactive),
    onSuccess: async (_, { active }) => {
      toast.success(t(active ? 'branch.toast.activated' : 'branch.toast.deactivated'))
      await invalidate()
    }
  })

  const columns = useMemo(
    () =>
      orgMgtColumn.getBranch(t, getTranslateEnum, {
        onAction: (action: TBranchAction, branch) => {
          if (action === 'view') setViewingId(branch.id)
          else if (action === 'edit') setFormBranch(branch)
          else setDeleting(branch)
        },
        onToggle: (branch, active) => toggle({ branch, active }),
        canManage,
        togglingId: toggling?.branch.id
      }),
    [t, getTranslateEnum, toggle, toggling, canManage]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TKeywordFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getKeywordFilterSchema(t)),
    mode: 'all'
  })

  // the picker changes ?companyId= and drops the keyword: start the form over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TKeywordFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined
  })
  const listParams: IBranchListParams = {
    ...toApiPaging(),
    companyId,
    ...handleConvertData(urlValues),
    // the BE `status` param is a Java enum: ALL is not a value, omitted = every status
    status: tab === EOrgStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListBranchApi({
    params: listParams,
    enabled: isReady && canView
  })

  const { mutate: deleteBranch, isPending: isDeleting } = useMutationApi({
    mutationFn: (branch: IBranch) => BranchService.Delete(branch.id ?? ''),
    onSuccess: async () => {
      toast.success(t('branch.toast.deleted'))
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
          <h1 className='text-xl font-semibold'>{t('branch.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('branch.subtitle')}</p>
        </div>
        {isReady && canManage && (
          <Button className='h-[38px]' onClick={() => setFormBranch(null)}>
            <Plus />
            {t('branch.add')}
          </Button>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('branch.pick_company')} />
      ) : (
        <>
          <form
            className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_auto]'
            onSubmit={(e) => {
              e.preventDefault()
              void handleSearch()
            }}
            noValidate
          >
            <Controller
              name={EKeywordFilterFormKey.Keyword}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='branch-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='branch-keyword'
                      placeholder={t('branch.keyword_placeholder')}
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

          <TabsCustom value={tab} onChange={handleTabChange} options={DATA.GET_ORG_STATUS_TABS(t)} isNoSyncParams />

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
            emptyText={listParams.keyword ? t('saas.empty_filtered') : t('branch.empty')}
          />
        </>
      )}

      <BranchDetailSheet branchId={viewingId} onClose={() => setViewingId(undefined)} />
      <BranchFormDialog branch={formBranch} companyId={companyId} onClose={() => setFormBranch(undefined)} />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('branch.delete.title')}
        description={t('branch.delete.description', { name: deleting?.name ?? '-' })}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteBranch(deleting)}
      />
    </PageLayout>
  )
}
