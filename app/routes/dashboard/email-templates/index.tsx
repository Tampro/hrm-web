import { zodResolver } from '@hookform/resolvers/zod'
import { Search } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { TableCustom } from '~/components/customs/table-custom'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { emailTemplateMgtColumn } from '~/helpers/columns/email-template-mgt-column'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useGetListEmailTemplateApi } from '~/hooks/apis/use-email-template-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import type { IEmailTemplateListParams } from '~/shared/models/email-template.model'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

export function meta() {
  return [{ title: 'Email templates · SPECOM HRM' }]
}

// Manual 3.3.1 Email Templates. Spec: GET /settings/admin/email-templates (keyword matches name or From Name)
export default function EmailTemplatesPage() {
  // Lib
  const { t } = useTranslation()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const columns = useMemo(() => emailTemplateMgtColumn.getEmailTemplate(t), [t])

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
  const listParams: IEmailTemplateListParams = { ...toApiPaging(), ...handleConvertData(urlValues) }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListEmailTemplateApi({
    params: listParams
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
    setQuery(paramsHelper.keywordToSearchParams(searchParams))
  }, [])

  return (
    <PageLayout>
      <div>
        <h1 className='text-xl font-semibold'>{t('email_template.title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('email_template.subtitle')}</p>
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
              <FieldLabel htmlFor='email-template-keyword'>{t('saas.filter.keyword')}</FieldLabel>
              <div className='relative'>
                <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                <Input
                  {...field}
                  id='email-template-keyword'
                  placeholder={t('email_template.keyword_placeholder')}
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
        emptyText={listParams.keyword ? t('saas.empty_filtered') : t('email_template.empty')}
      />
    </PageLayout>
  )
}
