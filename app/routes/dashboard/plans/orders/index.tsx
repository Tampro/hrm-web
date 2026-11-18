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
  useDefaultCurrencyApi,
  useGetListOrderApi,
  useGetOrderStatusCountsApi,
  useInvalidateSaas
} from '~/hooks/apis/use-plan-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { OrderService } from '~/services/plan.service'
import { DATA } from '~/shared/constants/data.constant'
import { ESaasFilterFormKey } from '~/shared/enums/form.enum'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import type { IAdminOrder, IOrderListParams } from '~/shared/models/saas.model'

import { DecisionDialog } from '../components/decision-dialog'
import { OrderDetailSheet } from '../components/order-detail-sheet'
import { SaasFilterBar } from '../components/saas-filter-bar'

const DEFAULT_VALUES: TSaasFilterSchema = {
  [ESaasFilterFormKey.Keyword]: '',
  [ESaasFilterFormKey.DateFrom]: '',
  [ESaasFilterFormKey.DateTo]: ''
}

// Manual 3.2.3 Plan Orders. Spec: GET /saas/admin/orders (keyword, dateFrom, dateTo, status, page zero-based)
export default function PlanOrdersPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateSaas()
  const { data: currency } = useDefaultCurrencyApi()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const [tab, setTab] = useState<ESaasRequestStatus>(() => paramsHelper.getSaasTab(searchParams))

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [viewingId, setViewingId] = useState<string | undefined>()
  const [deciding, setDeciding] = useState<{ decision: TDecision; row: IAdminOrder } | undefined>()
  const columns = useMemo(
    () =>
      planMgtColumn.getOrder(t, getTranslateEnum, currency, (action, row) =>
        action === 'view' ? setViewingId(row.order?.id) : setDeciding({ decision: action, row })
      ),
    [t, getTranslateEnum, currency]
  )

  // Form
  const form = useForm<TSaasFilterSchema>({
    defaultValues: formHelper.getDefaultValues(searchParams, DEFAULT_VALUES),
    resolver: zodResolver(getSaasFilterSchema(t)),
    mode: 'all'
  })

  // Convert data
  const handleConvertData = (values: TSaasFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined,
    dateFrom: values.dateFrom || undefined,
    dateTo: values.dateTo || undefined
  })
  const appliedFilters = handleConvertData(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  const appliedCount = Object.values(appliedFilters).filter(Boolean).length
  const listParams: IOrderListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // TODO: send ALL once BE supports it — `status` accepts only PENDING | APPROVED | REJECTED | CANCELLED
    status: tab === ESaasRequestStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListOrderApi({ params: listParams })
  const { data: counts } = useGetOrderStatusCountsApi(appliedFilters)
  // AdminOrderDto has no top-level id: lift it for row keys
  const rows = useMemo(() => dataList.map((row) => ({ ...row, id: row.order?.id })), [dataList])

  const { mutate: decide, isPending: isDeciding } = useMutationApi({
    mutationFn: ({ notes }: { notes: string }) => {
      const id = deciding?.row.order?.id ?? ''
      const payload = { notes: notes || undefined }
      return deciding?.decision === 'reject' ? OrderService.Reject(id, payload) : OrderService.Approve(id, payload)
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
    updateQueries({ ...getResetPaging(), ...DEFAULT_VALUES })
  }

  // One URL update (two back-to-back setSearchParams calls overwrite each other)
  const handleTabChange = (next: ESaasRequestStatus) => {
    setTab(next)
    updateQueries({ tab: next, page: getSearchPaging().page })
  }

  // Sync data and url
  useEffect(() => {
    setQuery(paramsHelper.saasToSearchParams(searchParams, DEFAULT_VALUES, tab, { withDates: true }))
  }, [])

  return (
    <>
      <SaasFilterBar
        form={form}
        keywordPlaceholder={t('saas.filter.order_keyword_placeholder')}
        withDates
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
        data={rows}
        loading={isLoading || isRefetching}
        totalItems={totalElement}
        page={paging.page}
        size={paging.size}
        totalPage={totalPage}
        onPageChange={setPage}
        onSizeChange={setSize}
        disableNavigationAll
        emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('order.empty')}
      />
      <OrderDetailSheet orderId={viewingId} currency={currency} onClose={() => setViewingId(undefined)} />
      <DecisionDialog
        target={deciding && { decision: deciding.decision, label: deciding.row.order?.orderNumber ?? '-' }}
        loading={isDeciding}
        onClose={() => setDeciding(undefined)}
        onSubmit={(notes) => decide({ notes })}
      />
    </>
  )
}
