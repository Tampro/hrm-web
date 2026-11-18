import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DecisionDialog } from '~/components/common/decision-dialog'
import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import type { TDecision } from '~/helpers/columns/plan-mgt-column'
import { referralMgtColumn } from '~/helpers/columns/referral-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useGetListPayoutApi, useInvalidateReferral, usePayoutStatusCountsApi } from '~/hooks/apis/use-referral-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { ReferralService } from '~/services/referral.service'
import { DATA } from '~/shared/constants/data.constant'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import { EPayoutStatus } from '~/shared/enums/referral.enum'
import type { IPayout, IPayoutListParams } from '~/shared/models/referral.model'

import { KeywordFilterBar } from '../components/keyword-filter-bar'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

// Payout requests. Spec: GET /saas/admin/referral/payouts (keyword, status = tab) + status-counts; approve / reject
// with PayoutDecisionForm { notes ≤ 500 } — payment itself is made outside the system
export default function PayoutRequestsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateReferral()
  const { data: currency } = useDefaultCurrencyApi()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const [tab, setTab] = useState<EPayoutStatus>(() => paramsHelper.getPayoutTab(searchParams))

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [deciding, setDeciding] = useState<{ decision: TDecision; payout: IPayout } | undefined>()
  const columns = useMemo(
    () =>
      referralMgtColumn.getPayout(t, getTranslateEnum, currency, (decision, payout) =>
        setDeciding({ decision, payout })
      ),
    [t, getTranslateEnum, currency]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TKeywordFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getKeywordFilterSchema(t)),
    mode: 'all'
  })

  // Convert data
  const handleConvertData = (values: TKeywordFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined
  })
  const appliedFilters = handleConvertData(urlValues)
  const listParams: IPayoutListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // TODO: send ALL once BE supports it — `status` accepts only PENDING | APPROVED | REJECTED
    status: tab === EPayoutStatus.All ? undefined : tab
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListPayoutApi({ params: listParams })
  const { data: counts } = usePayoutStatusCountsApi(appliedFilters)

  const { mutate: decide, isPending: isDeciding } = useMutationApi({
    mutationFn: ({ notes }: { notes: string }) => {
      const id = deciding?.payout.id ?? ''
      const payload = { notes: notes || undefined }
      return deciding?.decision === 'reject'
        ? ReferralService.RejectPayout(id, payload)
        : ReferralService.ApprovePayout(id, payload)
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
  const handleTabChange = (next: EPayoutStatus) => {
    setTab(next)
    updateQueries({ tab: next, page: getSearchPaging().page })
  }

  // Sync data and url
  useEffect(() => {
    setQuery(paramsHelper.keywordToSearchParams(searchParams, tab))
  }, [])

  const amount = commonHelper.formatMoney(deciding?.payout.amount, currency)

  return (
    <>
      <KeywordFilterBar
        form={form}
        placeholder={t('referral.keyword_placeholder')}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <TabsCustom
        value={tab}
        onChange={handleTabChange}
        options={DATA.GET_PAYOUT_STATUS_TABS(t, counts)}
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
        emptyText={listParams.keyword ? t('saas.empty_filtered') : t('referral.payouts.empty')}
      />
      <DecisionDialog
        target={deciding && { decision: deciding.decision, label: deciding.payout.companyName ?? '-' }}
        approveDescription={t('referral.payouts.approve_description', { amount })}
        rejectDescription={t('referral.payouts.reject_description', { amount })}
        loading={isDeciding}
        onClose={() => setDeciding(undefined)}
        onSubmit={(notes) => decide({ notes })}
      />
    </>
  )
}
