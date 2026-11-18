import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { planMgtColumn, type TDecision } from '~/helpers/columns/plan-mgt-column'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getSaasFilterSchema, type TSaasFilterSchema } from '~/helpers/schema.helper'
import {
  useGetListPlanRequestApi,
  useGetPlanRequestStatusCountsApi,
  useInvalidateSaas
} from '~/hooks/apis/use-plan-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PlanRequestService } from '~/services/plan.service'
import { DATA } from '~/shared/constants/data.constant'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import { ESaasFilterFormKey } from '~/shared/enums/form.enum'
import type { IPlanRequest, IPlanRequestListParams } from '~/shared/models/saas.model'

import { DecisionDialog } from '~/components/common/decision-dialog'
import { SaasFilterBar } from '~/components/common/saas-filter-bar'

const DEFAULT_VALUES: TSaasFilterSchema = {
  [ESaasFilterFormKey.Keyword]: '',
  [ESaasFilterFormKey.DateFrom]: '',
  [ESaasFilterFormKey.DateTo]: ''
}

// Manual 3.2.3 Plan Requests. Spec: GET /saas/admin/plan-requests (keyword, status, page zero-based) + status-counts
export default function PlanRequestsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateSaas()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const [tab, setTab] = useState<ESaasRequestStatus>(() => paramsHelper.getSaasTab(searchParams))

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [deciding, setDeciding] = useState<{ decision: TDecision; request: IPlanRequest } | undefined>()
  const columns = useMemo(
    () => planMgtColumn.getPlanRequest(t, getTranslateEnum, (decision, request) => setDeciding({ decision, request })),
    [t, getTranslateEnum]
  )

  // Form
  const form = useForm<TSaasFilterSchema>({
    defaultValues: formHelper.getDefaultValues(searchParams, DEFAULT_VALUES),
    resolver: zodResolver(getSaasFilterSchema(t)),
    mode: 'all'
  })

  // Convert data
  const handleConvertData = (values: TSaasFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined
  })
  const appliedFilters = handleConvertData(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  const appliedCount = Object.values(appliedFilters).filter(Boolean).length
  const listParams: IPlanRequestListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // TODO: send ALL once BE supports it — `status` accepts only PENDING | APPROVED | REJECTED | CANCELLED
    status: tab === ESaasRequestStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListPlanRequestApi({
    params: listParams
  })
  const { data: counts } = useGetPlanRequestStatusCountsApi(appliedFilters)

  const { mutate: decide, isPending: isDeciding } = useMutationApi({
    mutationFn: ({ notes }: { notes: string }) => {
      const id = deciding?.request.id ?? ''
      const payload = { notes: notes || undefined }
      return deciding?.decision === 'reject'
        ? PlanRequestService.Reject(id, payload)
        : PlanRequestService.Approve(id, payload)
    },
    onSuccess: async () => {
      toast.success(t(deciding?.decision === 'reject' ? 'saas.toast.rejected' : 'saas.toast.approved'))
      await invalidate()
      setDeciding(undefined)
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

  // One URL update (two back-to-back setSearchParams calls overwrite each other)
  const handleTabChange = (next: ESaasRequestStatus) => {
    setTab(next)
    updateQueries({ tab: next, page: getSearchPaging().page })
  }

  // Sync data and url
  useEffect(() => {
    setQuery(paramsHelper.saasToSearchParams(searchParams, DEFAULT_VALUES, tab, { withDates: false }))
  }, [])

  return (
    <>
      <SaasFilterBar
        form={form}
        keywordPlaceholder={t('saas.filter.request_keyword_placeholder')}
        appliedCount={appliedCount}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <TabsCustom
        value={tab}
        onChange={handleTabChange}
        options={DATA.GET_SAAS_STATUS_TABS(t, counts)}
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
        emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('saas.request_empty')}
      />
      <DecisionDialog
        target={deciding && { decision: deciding.decision, label: deciding.request.companyName ?? '-' }}
        loading={isDeciding}
        onClose={() => setDeciding(undefined)}
        onSubmit={(notes) => decide({ notes })}
      />
    </>
  )
}
