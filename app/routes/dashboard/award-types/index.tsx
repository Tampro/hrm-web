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
import { orgMgtColumn, type TAwardTypeAction } from '~/helpers/columns/org-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getKeywordFilterSchema, type TKeywordFilterSchema } from '~/helpers/schema.helper'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useGetListAwardTypeApi } from '~/hooks/apis/use-org-api'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { AwardTypeService } from '~/services/org.service'
import { DATA } from '~/shared/constants/data.constant'
import { EKeywordFilterFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IAwardType, IAwardTypeListParams } from '~/shared/models/org.model'

import { AwardTypeForm } from './components/award-type-form'

const DEFAULT_VALUES: TKeywordFilterSchema = { [EKeywordFilterFormKey.Keyword]: '' }

export function meta() {
  return [{ title: 'Award types · SPECOM HRM' }]
}

// Manual 6.3.6 Award Types: "Add New Award Type" form on the left, the list (search + All Statuses) on the right.
// Spec: GET /org/award-types (keyword matches name or description; status ACTIVE | INACTIVE, omitted = all)
export default function AwardTypesPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { data: me, isLoading: isLoadingMe } = useMeApi()
  const canView = !!me?.superAdmin || !!me?.permissions?.includes('ORG_VIEW')
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ORG_MANAGE')
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  // the status filter lives in the URL only, so the company picker (which rewrites the URL) resets it too
  const status = commonHelper.toEnumValue(searchParams.get('status'), Object.values(EOrgStatus), EOrgStatus.All)

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [editing, setEditing] = useState<IAwardType | undefined>()
  const [deleting, setDeleting] = useState<IAwardType | undefined>()

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
  const listParams: IAwardTypeListParams = {
    ...toApiPaging(),
    companyId,
    ...handleConvertData(urlValues),
    // the BE `status` param is a Java enum: ALL is not a value, omitted = every status
    status: status === EOrgStatus.All ? undefined : status
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching, refetch } = useGetListAwardTypeApi({
    params: listParams,
    enabled: isReady && canView
  })

  const { mutate: toggle, variables: toggling } = useMutationApi({
    mutationFn: (a: IAwardType) =>
      AwardTypeService.UpdateStatus(
        a.id ?? '',
        a.status === EOrgStatus.Active ? EOrgStatus.Inactive : EOrgStatus.Active
      ),
    onSuccess: async (_, a) => {
      toast.success(t(a.status === EOrgStatus.Active ? 'award_type.toast.deactivated' : 'award_type.toast.activated'))
      await refetch()
    }
  })
  const { mutate: deleteAwardType, isPending: isDeleting } = useMutationApi({
    mutationFn: (a: IAwardType) => AwardTypeService.Delete(a.id ?? ''),
    onSuccess: async (_, a) => {
      toast.success(t('award_type.toast.deleted'))
      if (a.id === editing?.id) setEditing(undefined)
      setDeleting(undefined)
      await refetch()
    }
  })

  const columns = useMemo(
    () =>
      orgMgtColumn.getAwardType(t, getTranslateEnum, {
        onAction: (action: TAwardTypeAction, a) => {
          if (action === 'edit') setEditing(a)
          else if (action === 'toggle') toggle(a)
          else setDeleting(a)
        },
        canManage,
        busyId: toggling?.id
      }),
    [t, getTranslateEnum, canManage, toggle, toggling]
  )

  // Search
  const handleSearch = form.handleSubmit((values) =>
    updateQueries({ ...getSearchPaging(), ...handleConvertData(values) })
  )

  // Reset
  const handleReset = () => {
    form.reset(DEFAULT_VALUES)
    resetPaging()
    updateQueries({ ...getResetPaging(), keyword: undefined, status: undefined })
  }

  // Sync data and url (companyId straight from the URL: /me may not be loaded yet on mount)
  useEffect(() => {
    setQuery({
      ...paramsHelper.keywordToSearchParams(searchParams),
      status,
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

  const statusItems = DATA.GET_ORG_STATUS_OPTIONS(t)

  return (
    <PageLayout>
      <div>
        <h1 className='text-xl font-semibold'>{t('award_type.title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('award_type.subtitle')}</p>
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint message={t('award_type.pick_company')} />
      ) : (
        <div
          className={
            canManage ? 'grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]' : 'flex flex-col gap-4'
          }
        >
          {canManage && (
            <AwardTypeForm
              editing={editing}
              companyId={companyId}
              onDone={() => setEditing(undefined)}
              onSaved={refetch}
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
                    <FieldLabel htmlFor='award-type-keyword'>{t('saas.filter.keyword')}</FieldLabel>
                    <div className='relative'>
                      <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
                      <Input
                        {...field}
                        id='award-type-keyword'
                        placeholder={t('award_type.keyword_placeholder')}
                        className='h-[38px] pl-8'
                      />
                    </div>
                  </Field>
                )}
              />
              <Field>
                <FieldLabel htmlFor='award-type-status'>{t('award_type.field.status')}</FieldLabel>
                <Select
                  items={statusItems}
                  value={status}
                  onValueChange={(v) => v && updateQueries({ status: v, page: getSearchPaging().page })}
                >
                  <SelectTrigger id='award-type-status' className='h-[38px] w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
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
              emptyText={listParams.keyword || listParams.status ? t('saas.empty_filtered') : t('award_type.empty')}
            />
          </div>
        </div>
      )}

      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('award_type.delete.title', { name: deleting?.name ?? '-' })}
        description={t('award_type.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteAwardType(deleting)}
      />
    </PageLayout>
  )
}
