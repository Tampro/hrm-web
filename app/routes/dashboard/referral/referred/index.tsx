import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { StatCards } from '~/components/customs/stat-cards'
import { TableCustom } from '~/components/customs/table-custom'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { referralMgtColumn } from '~/helpers/columns/referral-mgt-column'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useGetListReferredApi, useReferredSummaryApi } from '~/hooks/apis/use-referral-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { DATA } from '~/shared/constants/data.constant'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import type { IReferredCompany, IReferredListParams } from '~/shared/models/referral.model'

import { KeywordFilterBar } from '../components/keyword-filter-bar'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

// Referred users. Spec: GET /saas/admin/referral/referred (keyword: company name or email) + /referred/summary
export default function ReferredUsersPage() {
  // Lib
  const { t } = useTranslation()
  const { data: currency } = useDefaultCurrencyApi()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [historyOf, setHistoryOf] = useState<IReferredCompany | undefined>()
  const shownHistory = useLastDefined(historyOf)
  const columns = useMemo(() => referralMgtColumn.getReferred(t, currency, setHistoryOf), [t, currency])
  const commissionColumns = useMemo(() => referralMgtColumn.getCommission(t, currency), [t, currency])

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
  const listParams: IReferredListParams = { ...toApiPaging(), ...handleConvertData(urlValues) }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListReferredApi({ params: listParams })
  const { data: summary, isLoading: isSummaryLoading } = useReferredSummaryApi()
  // ReferredCompanyDto has no id: use the company id for row keys
  const rows = useMemo(() => dataList.map((row) => ({ ...row, id: row.companyId })), [dataList])
  const history = useMemo(
    () => (shownHistory?.commissionHistory ?? []).map((row, index) => ({ ...row, id: row.orderId ?? String(index) })),
    [shownHistory]
  )

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

  // Sync data and url
  useEffect(() => {
    setQuery(paramsHelper.keywordToSearchParams(searchParams))
  }, [])

  return (
    <>
      <StatCards
        label={t('referral.referred.summary')}
        items={DATA.GET_REFERRED_SUMMARY_CARDS(t, summary, currency)}
        loading={isSummaryLoading}
        className='xl:grid-cols-3'
      />
      <KeywordFilterBar
        form={form}
        placeholder={t('referral.keyword_placeholder')}
        onSearch={handleSearch}
        onReset={handleReset}
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
        emptyText={listParams.keyword ? t('saas.empty_filtered') : t('referral.referred.empty')}
      />

      <Sheet open={!!historyOf} onOpenChange={(open) => !open && setHistoryOf(undefined)}>
        <SheetContent className='w-full gap-0 sm:max-w-lg'>
          <SheetHeader>
            <SheetTitle>{t('referral.field.commission_history')}</SheetTitle>
            <SheetDescription>{shownHistory?.companyName || '-'}</SheetDescription>
          </SheetHeader>
          <div className='px-4 pb-6'>
            <TableCustom
              columns={commissionColumns}
              data={history}
              disableNavigationAll
              emptyText={t('referral.referred.no_commission')}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
