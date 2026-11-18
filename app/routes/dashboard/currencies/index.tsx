import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { currencyMgtColumn, type TCurrencyAction } from '~/helpers/columns/currency-mgt-column'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useGetAdminListCurrencyApi, useInvalidateCurrencies } from '~/hooks/apis/use-currency-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { CurrencyService } from '~/services/plan.service'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import type { ICurrency, ICurrencyListParams } from '~/shared/models/saas.model'

import { CurrencyDetailSheet } from './components/currency-detail-sheet'
import { CurrencyFormDialog } from './components/currency-form-dialog'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

export function meta() {
  return [{ title: 'Currencies · SPECOM HRM' }]
}

// Manual 3.2.5 Currency. Spec: GET /saas/admin/currencies (keyword matches name, code or symbol; page zero-based)
export default function CurrenciesPage() {
  // Lib
  const { t } = useTranslation()
  const invalidate = useInvalidateCurrencies()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [viewingId, setViewingId] = useState<string | undefined>()
  const [formCurrency, setFormCurrency] = useState<ICurrency | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<ICurrency | undefined>()
  const columns = useMemo(
    () =>
      currencyMgtColumn.getCurrency(t, (action: TCurrencyAction, currency) => {
        if (action === 'view') setViewingId(currency.id)
        else if (action === 'edit') setFormCurrency(currency)
        else setDeleting(currency)
      }),
    [t]
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
  const listParams: ICurrencyListParams = { ...toApiPaging(), ...handleConvertData(urlValues) }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetAdminListCurrencyApi({
    params: listParams
  })

  const { mutate: deleteCurrency, isPending: isDeleting } = useMutationApi({
    mutationFn: (currency: ICurrency) => CurrencyService.Delete(currency.id ?? ''),
    onSuccess: async () => {
      toast.success(t('currency.toast.deleted'))
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

  // Sync data and url
  useEffect(() => {
    setQuery(paramsHelper.currencyToSearchParams(searchParams, DEFAULT_VALUES))
  }, [])

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('currency.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('currency.subtitle')}</p>
        </div>
        <Button className='h-[38px]' onClick={() => setFormCurrency(null)}>
          <Plus />
          {t('currency.add')}
        </Button>
      </div>

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
              <FieldLabel htmlFor='currency-keyword'>{t('saas.filter.keyword')}</FieldLabel>
              <div className='relative'>
                <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                <Input
                  {...field}
                  id='currency-keyword'
                  placeholder={t('currency.keyword_placeholder')}
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
        emptyText={listParams.keyword ? t('saas.empty_filtered') : t('currency.empty')}
      />

      <CurrencyDetailSheet currencyId={viewingId} onClose={() => setViewingId(undefined)} />
      <CurrencyFormDialog currency={formCurrency} onClose={() => setFormCurrency(undefined)} />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('currency.delete.title')}
        description={t('currency.delete.description', { name: deleting?.name ?? '-', code: deleting?.code ?? '-' })}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteCurrency(deleting)}
      />
    </PageLayout>
  )
}
