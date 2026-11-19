import { zodResolver } from '@hookform/resolvers/zod'
import { Search, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { orgMgtColumn, type TDocumentTypeAction } from '~/helpers/columns/org-mgt-column'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useGetListDocumentTypeApi, useInvalidateDocumentTypes } from '~/hooks/apis/use-org-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { DocumentTypeService } from '~/services/org.service'
import { DATA } from '~/shared/constants/data.constant'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import type { IDocumentType } from '~/shared/models/employee.model'
import type { IDocumentTypeListParams } from '~/shared/models/org.model'

import { DocumentTypeForm } from './components/document-type-form'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

export function meta() {
  return [{ title: 'Document types · SPECOM HRM' }]
}

// Manual 6.3.7 Document Types: "Add New Document Type" form on the left, the list on the right.
// Spec: GET /org/document-types (system types first, then by name; keyword matches name or description;
// required = true | false filters, omitted = all)
export default function DocumentTypesPage() {
  // Lib
  const { t } = useTranslation()
  const invalidate = useInvalidateDocumentTypes()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ORG_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ORG_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  // '' = all, 'true' = Required, 'false' = Optional; in the URL only, so the company picker resets it too
  const required = ['true', 'false'].includes(searchParams.get('required') ?? '') ? searchParams.get('required')! : ''

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [editing, setEditing] = useState<IDocumentType | undefined>()
  const [deleting, setDeleting] = useState<IDocumentType | undefined>()
  const columns = useMemo(
    () =>
      orgMgtColumn.getDocumentType(t, {
        onAction: (action: TDocumentTypeAction, d) => (action === 'edit' ? setEditing(d) : setDeleting(d)),
        canManage
      }),
    [t, canManage]
  )

  // Form
  const urlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const form = useForm<TKeywordFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getKeywordFilterSchema(t)),
    mode: 'all'
  })

  // the picker changes ?companyId= and drops the keyword: start over
  useEffect(() => {
    form.reset(formHelper.getDefaultValues(searchParams, DEFAULT_VALUES))
  }, [companyId])

  // Convert data
  const handleConvertData = (values: TKeywordFilterSchema = form.getValues()) => ({
    keyword: values.keyword.trim() || undefined
  })
  const listParams: IDocumentTypeListParams = {
    ...toApiPaging(),
    companyId,
    ...handleConvertData(urlValues),
    required: required === '' ? undefined : required === 'true'
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListDocumentTypeApi({
    params: listParams,
    enabled: isReady && canView
  })

  const { mutate: deleteType, isPending: isDeleting } = useMutationApi({
    mutationFn: (d: IDocumentType) => DocumentTypeService.Delete(d.id ?? ''),
    onSuccess: async (_, d) => {
      toast.success(t('document_type.toast.deleted'))
      if (d.id === editing?.id) setEditing(undefined)
      setDeleting(undefined)
      await invalidate()
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
    updateQueries({ ...getResetPaging(), keyword: undefined, required: undefined })
  }

  // Sync data and url (companyId straight from the URL: /me may not be loaded yet on mount)
  useEffect(() => {
    setQuery({
      ...paramsHelper.keywordToSearchParams(searchParams),
      required: required || undefined,
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

  const requiredItems = DATA.GET_REQUIRED_FILTER_OPTIONS(t)

  return (
    <PageLayout>
      <div>
        <h1 className='text-xl font-semibold'>{t('document_type.title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('document_type.subtitle')}</p>
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('document_type.pick_company')} />
      ) : (
        <div
          className={
            canManage ? 'grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]' : 'flex flex-col gap-4'
          }
        >
          {canManage && (
            <DocumentTypeForm
              editing={editing}
              companyId={companyId}
              onDone={() => setEditing(undefined)}
              onSaved={invalidate}
            />
          )}

          <div className='flex min-w-0 flex-col gap-4'>
            <form
              className='bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]'
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
                    <FieldLabel htmlFor='document-type-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                    <div className='relative'>
                      <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                      <Input
                        {...field}
                        id='document-type-keyword'
                        placeholder={t('document_type.keyword_placeholder')}
                        className='h-[38px] pl-8'
                      />
                    </div>
                  </Field>
                )}
              />
              <Field>
                <FieldLabel htmlFor='document-type-required'>{t('document_type.field.required')}</FieldLabel>
                <Select
                  items={requiredItems}
                  value={required}
                  onValueChange={(v) =>
                    updateQueries({ required: v === null || v === '' ? undefined : v, page: getSearchPaging().page })
                  }
                >
                  <SelectTrigger id='document-type-required' className='h-[38px] w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {requiredItems.map((item) => (
                      <SelectItem key={item.value || 'all'} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
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
              emptyText={
                listParams.keyword || listParams.required !== undefined
                  ? t('saas.empty_filtered')
                  : t('document_type.empty')
              }
            />
          </div>
        </div>
      )}

      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('document_type.delete.title', { name: deleting?.name ?? '-' })}
        description={t('document_type.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteType(deleting)}
      />
    </PageLayout>
  )
}
