import { zodResolver } from '@hookform/resolvers/zod'
import { Download, Network, Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Button, buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { employeeMgtColumn } from '~/helpers/columns/employee-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getEmployeeFilterSchema, type TEmployeeFilterSchema } from '~/helpers/schemas/employee.schema'
import { useGetEmployeeStatusCountsApi, useGetListEmployeeApi } from '~/hooks/apis/use-employee-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { EmployeeService } from '~/services/employee.service'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EEmployeeStatus } from '~/shared/enums/employee.enum'
import { EEmployeeFilterFormKey } from '~/shared/enums/form.enum'
import type { IEmployeeListParams } from '~/shared/models/employee.model'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { EmployeeFilterBar } from './components/employee-filter-bar'
import { ImportEmployeesDialog } from './components/import-employees-dialog'

const DEFAULT_VALUES: TEmployeeFilterSchema = {
  [EEmployeeFilterFormKey.Keyword]: '',
  [EEmployeeFilterFormKey.BranchId]: '',
  [EEmployeeFilterFormKey.DepartmentId]: '',
  [EEmployeeFilterFormKey.DesignationId]: ''
}

export function meta() {
  return [{ title: 'Employees · SPECOM HRM' }]
}

/** Appends ?companyId= for a super admin so the next page acts on the same company */
const withCompany = (path: string, companyId?: string) => (companyId ? `${path}?companyId=${companyId}` : path)

// Manual 6.1 Employees. Spec: GET /employees (+ /status-counts with the same filters), super admin passes companyId
export default function EmployeesPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { data: me } = useMeApi()
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()
  const can = (permission: string) => !!me?.superAdmin || !!me?.permissions?.includes(permission)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  // the tab lives in the URL only, so the company picker (which rewrites the URL) resets it too
  const tab = paramsHelper.getEmployeeTab(searchParams)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const columns = useMemo(() => employeeMgtColumn.getEmployee(t, getTranslateEnum), [t, getTranslateEnum])

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TEmployeeFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getEmployeeFilterSchema(t)),
    mode: 'all'
  })

  // the picker changes ?companyId= and drops the other filters: start the form over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TEmployeeFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    branchId: values.branchId || undefined,
    departmentId: values.departmentId || undefined,
    designationId: values.designationId || undefined
  })
  const appliedFilters = { companyId, ...handleConvertData(urlValues) }
  const appliedCount = Object.values(handleConvertData(urlValues)).filter(Boolean).length
  const listParams: IEmployeeListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // the BE `status` param is a Java enum: ALL is not a value, omitted = every status
    status: tab === EEmployeeStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListEmployeeApi({
    params: listParams,
    enabled: isReady
  })
  const { data: counts } = useGetEmployeeStatusCountsApi(appliedFilters, isReady)

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
      branchId: undefined,
      departmentId: undefined,
      designationId: undefined
    })
  }

  const handleTabChange = (next: EEmployeeStatus) => {
    updateQueries({ tab: next, page: getSearchPaging().page })
  }

  // Spec: GET /employees/export — same filters as the list (status included), banking is not exported
  const handleExport = async () => {
    setIsExporting(true)
    try {
      commonHelper.downloadBlob(
        await EmployeeService.Export({ ...appliedFilters, status: listParams.status }),
        'employees.xlsx'
      )
    } catch {
      // axiosClient already showed the error toast
    } finally {
      setIsExporting(false)
    }
  }

  // Sync data and url
  useEffect(() => {
    setQuery(
      paramsHelper.employeeToSearchParams(searchParams, DEFAULT_VALUES, tab, searchParams.get('companyId') ?? undefined)
    )
  }, [])

  return (
    <PageLayout>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('employee.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('employee.subtitle')}</p>
        </div>
        {isReady && (
          <div className='flex flex-wrap gap-2'>
            <Link
              to={withCompany(ROUTES.EMPLOYEE_ORG_CHART, companyId)}
              className={cn(buttonVariants({ variant: 'outline', className: 'h-[38px]' }))}
            >
              <Network />
              {t('employee.org_chart.open')}
            </Link>
            {can('EMPLOYEE_CREATE') && (
              <Button variant='outline' className='h-[38px]' onClick={() => setIsImportOpen(true)}>
                <Upload />
                {t('employee.import.open')}
              </Button>
            )}
            <Button variant='outline' className='h-[38px]' disabled={isExporting} onClick={() => void handleExport()}>
              <Download />
              {isExporting ? t('employee.export.exporting') : t('employee.export.open')}
            </Button>
            {can('EMPLOYEE_CREATE') && (
              <Link
                to={withCompany(ROUTES.EMPLOYEE_CREATE, companyId)}
                className={cn(buttonVariants({ className: 'h-[38px]' }))}
              >
                <Plus />
                {t('employee.add')}
              </Link>
            )}
          </div>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint />
      ) : (
        <>
          <EmployeeFilterBar form={form} companyId={companyId} onSearch={handleSearch} onReset={handleReset} />

          <TabsCustom
            value={tab}
            onChange={handleTabChange}
            options={DATA.GET_EMPLOYEE_STATUS_TABS(t, counts)}
            isNoSyncParams
          />

          {/* Rows open the employee profile */}
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
            emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('employee.empty')}
          />
        </>
      )}

      <ImportEmployeesDialog open={isImportOpen} companyId={companyId} onClose={() => setIsImportOpen(false)} />
    </PageLayout>
  )
}
