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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { orgMgtColumn, type TDesignationAction } from '~/helpers/columns/org-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getDesignationFilterSchema, type TDesignationFilterSchema } from '~/helpers/schemas/org.schema'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useDepartmentChoicesApi, useGetListDesignationApi, useInvalidateDesignations } from '~/hooks/apis/use-org-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { DesignationService } from '~/services/org.service'
import { DATA } from '~/shared/constants/data.constant'
import { EDesignationFilterFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IDesignation, IDesignationListParams } from '~/shared/models/org.model'

import { DesignationDetailSheet } from './components/designation-detail-sheet'
import { DesignationFormDialog } from './components/designation-form-dialog'

const DEFAULT_VALUES: TDesignationFilterSchema = {
  [EDesignationFilterFormKey.Keyword]: '',
  [EDesignationFilterFormKey.DepartmentId]: ''
}

export function meta() {
  return [{ title: 'Designations · SPECOM HRM' }]
}

// Manual 6.4 Designations. Spec: GET /org/designations (keyword matches name or description; departmentId, status)
export default function DesignationsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateDesignations()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ORG_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ORG_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()
  const enabled = isReady && canView

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  // the tab lives in the URL only, so the company picker (which rewrites the URL) resets it too
  const tab = commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EOrgStatus), EOrgStatus.All)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [viewingId, setViewingId] = useState<string | undefined>()
  const [formDesignation, setFormDesignation] = useState<IDesignation | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IDesignation | undefined>()

  const { mutate: toggle, variables: toggling } = useMutationApi({
    mutationFn: ({ designation, active }: { designation: IDesignation; active: boolean }) =>
      DesignationService.UpdateStatus(designation.id ?? '', active ? EOrgStatus.Active : EOrgStatus.Inactive),
    onSuccess: async (_, { active }) => {
      toast.success(t(active ? 'designation.toast.activated' : 'designation.toast.deactivated'))
      await invalidate()
    }
  })

  const columns = useMemo(
    () =>
      orgMgtColumn.getDesignation(t, getTranslateEnum, {
        onAction: (action: TDesignationAction, designation) => {
          if (action === 'view') setViewingId(designation.id)
          else if (action === 'edit') setFormDesignation(designation)
          else setDeleting(designation)
        },
        onToggle: (designation, active) => toggle({ designation, active }),
        canManage,
        togglingId: toggling?.designation.id
      }),
    [t, getTranslateEnum, toggle, toggling, canManage]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TDesignationFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getDesignationFilterSchema(t)),
    mode: 'all'
  })
  const departmentItems = [
    { label: t('employee.filter.all'), value: '' },
    ...useDepartmentChoicesApi(companyId, enabled)
  ]

  // the picker changes ?companyId= and drops the filters: start the form over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TDesignationFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    departmentId: values.departmentId || undefined
  })
  const appliedCount = Object.values(handleConvertData(urlValues)).filter(Boolean).length
  const listParams: IDesignationListParams = {
    ...toApiPaging(),
    companyId,
    ...handleConvertData(urlValues),
    // the BE `status` param is a Java enum: ALL is not a value, omitted = every status
    status: tab === EOrgStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListDesignationApi({
    params: listParams,
    enabled
  })

  const { mutate: deleteDesignation, isPending: isDeleting } = useMutationApi({
    mutationFn: (designation: IDesignation) => DesignationService.Delete(designation.id ?? ''),
    onSuccess: async () => {
      toast.success(t('designation.toast.deleted'))
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
    updateQueries({ ...getResetPaging(), keyword: undefined, departmentId: undefined })
  }

  const handleTabChange = (next: EOrgStatus) => updateQueries({ tab: next, page: getSearchPaging().page })

  // Sync data and url (companyId straight from the URL: /me may not be loaded yet on mount)
  useEffect(() => {
    setQuery(
      paramsHelper.designationToSearchParams(
        searchParams,
        DEFAULT_VALUES,
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

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('designation.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('designation.subtitle')}</p>
        </div>
        {isReady && canManage && (
          <Button className='h-[38px]' onClick={() => setFormDesignation(null)}>
            <Plus />
            {t('designation.add')}
          </Button>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('designation.pick_company')} />
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
              name={EDesignationFilterFormKey.Keyword}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='designation-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='designation-keyword'
                      placeholder={t('designation.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
                </Field>
              )}
            />
            <Controller
              name={EDesignationFilterFormKey.DepartmentId}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='designation-department'>{t('designation.field.department')}</FieldLabel>
                  <Select items={departmentItems} value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger id='designation-department' className='h-[38px] w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentItems.map((item) => (
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
            emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('designation.empty')}
          />
        </>
      )}

      <DesignationDetailSheet designationId={viewingId} onClose={() => setViewingId(undefined)} />
      <DesignationFormDialog
        designation={formDesignation}
        companyId={companyId}
        onClose={() => setFormDesignation(undefined)}
      />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('designation.delete.title', { name: deleting?.name ?? '-' })}
        description={t('designation.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteDesignation(deleting)}
      />
    </PageLayout>
  )
}
