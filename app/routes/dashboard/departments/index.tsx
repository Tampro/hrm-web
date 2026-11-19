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
import { orgMgtColumn, type TDepartmentAction } from '~/helpers/columns/org-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getDepartmentFilterSchema, type TDepartmentFilterSchema } from '~/helpers/schemas/org.schema'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useBranchOptionsApi } from '~/hooks/apis/use-employee-api'
import {
  useGetDepartmentStatusCountsApi,
  useGetListDepartmentApi,
  useInvalidateDepartments
} from '~/hooks/apis/use-org-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { DepartmentService } from '~/services/org.service'
import { DATA } from '~/shared/constants/data.constant'
import { EDepartmentFilterFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IDepartment, IDepartmentListParams } from '~/shared/models/org.model'

import { DepartmentFormDialog } from './components/department-form-dialog'
import { DepartmentPanel } from './components/department-panel'

const DEFAULT_VALUES: TDepartmentFilterSchema = {
  [EDepartmentFilterFormKey.Keyword]: '',
  [EDepartmentFilterFormKey.BranchId]: ''
}

export function meta() {
  return [{ title: 'Departments · SPECOM HRM' }]
}

// Manual 6.3 Departments, design CmsPhongBan (table + selected department panel).
// Spec: GET /org/departments (+ /status-counts with the same keyword / branch filters)
export default function DepartmentsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateDepartments()
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
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [formDepartment, setFormDepartment] = useState<IDepartment | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IDepartment | undefined>()

  const { mutate: toggle, variables: toggling } = useMutationApi({
    mutationFn: ({ department, active }: { department: IDepartment; active: boolean }) =>
      DepartmentService.UpdateStatus(department.id ?? '', active ? EOrgStatus.Active : EOrgStatus.Inactive),
    onSuccess: async (_, { active }) => {
      toast.success(t(active ? 'department.toast.activated' : 'department.toast.deactivated'))
      await invalidate()
    }
  })

  const columns = useMemo(
    () =>
      orgMgtColumn.getDepartment(t, getTranslateEnum, {
        onAction: (action: TDepartmentAction, department) => {
          if (action === 'select') setSelectedId(department.id)
          else if (action === 'edit') setFormDepartment(department)
          else setDeleting(department)
        },
        onToggle: (department, active) => toggle({ department, active }),
        canManage,
        togglingId: toggling?.department.id
      }),
    [t, getTranslateEnum, toggle, toggling, canManage]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TDepartmentFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getDepartmentFilterSchema(t)),
    mode: 'all'
  })
  const { data: branches = [] } = useBranchOptionsApi(companyId, isReady && canView)
  const branchItems = [
    { label: t('employee.filter.all'), value: '' },
    ...branches.map((b) => ({ label: b.name ?? '-', value: b.id ?? '' }))
  ]

  // the picker changes ?companyId= and drops the filters: start the form over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TDepartmentFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    branchId: values.branchId || undefined
  })
  const appliedFilters = { companyId, ...handleConvertData(urlValues) }
  const appliedCount = Object.values(handleConvertData(urlValues)).filter(Boolean).length
  const listParams: IDepartmentListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // the BE `status` param is a Java enum: ALL is not a value, omitted = every status
    status: tab === EOrgStatus.All ? undefined : tab
  }

  // API
  const enabled = isReady && canView
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListDepartmentApi({
    params: listParams,
    enabled
  })
  const { data: counts } = useGetDepartmentStatusCountsApi(appliedFilters, enabled)

  const { mutate: deleteDepartment, isPending: isDeleting } = useMutationApi({
    mutationFn: (department: IDepartment) => DepartmentService.Delete(department.id ?? ''),
    onSuccess: async (_, department) => {
      toast.success(t('department.toast.deleted'))
      if (department.id === selectedId) setSelectedId(undefined)
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
    updateQueries({ ...getResetPaging(), keyword: undefined, branchId: undefined })
  }

  const handleTabChange = (next: EOrgStatus) => updateQueries({ tab: next, page: getSearchPaging().page })

  // Sync data and url (companyId straight from the URL: /me may not be loaded yet on mount)
  useEffect(() => {
    setQuery(
      paramsHelper.departmentToSearchParams(
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
          <h1 className='text-xl font-semibold'>{t('department.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('department.subtitle')}</p>
        </div>
        {isReady && canManage && (
          <Button className='h-[38px]' onClick={() => setFormDepartment(null)}>
            <Plus />
            {t('department.add')}
          </Button>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('department.pick_company')} />
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
              name={EDepartmentFilterFormKey.Keyword}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='department-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                  <div className='relative'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      id='department-keyword'
                      placeholder={t('department.keyword_placeholder')}
                      className='h-[38px] pl-8'
                    />
                  </div>
                </Field>
              )}
            />
            <Controller
              name={EDepartmentFilterFormKey.BranchId}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='department-branch'>{t('department.field.branch')}</FieldLabel>
                  <Select items={branchItems} value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger id='department-branch' className='h-[38px] w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branchItems.map((item) => (
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

          <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'>
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
              emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('department.empty')}
            />
            <DepartmentPanel
              departmentId={selectedId}
              canManage={canManage}
              onEdit={setFormDepartment}
              onDelete={setDeleting}
            />
          </div>
        </>
      )}

      <DepartmentFormDialog
        department={formDepartment}
        companyId={companyId}
        onClose={() => setFormDepartment(undefined)}
      />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('department.delete.title', { name: deleting?.name ?? '-' })}
        description={t('department.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteDepartment(deleting)}
      />
    </PageLayout>
  )
}
