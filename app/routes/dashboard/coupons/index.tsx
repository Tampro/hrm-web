import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Button } from '~/components/ui/button'
import { couponMgtColumn, type TCouponAction } from '~/helpers/columns/coupon-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { formHelper } from '~/helpers/form.helper'
import { paramsHelper } from '~/helpers/params.helper'
import { getCouponFilterSchema, type TCouponFilterSchema } from '~/helpers/schema.helper'
import { useGetCouponStatusCountsApi, useGetListCouponApi, useInvalidateCoupons } from '~/hooks/apis/use-coupon-api'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { usePagination } from '~/hooks/use-pagination'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { CouponService } from '~/services/coupon.service'
import { DATA } from '~/shared/constants/data.constant'
import { ECouponStatusTab, ECouponType } from '~/shared/enums/coupon.enum'
import { ECouponFilterFormKey } from '~/shared/enums/form.enum'
import type { ICoupon, ICouponListParams } from '~/shared/models/coupon.model'

import { CouponFilterBar } from './components/coupon-filter-bar'
import { CouponFormDialog } from './components/coupon-form-dialog'

const DEFAULT_VALUES: TCouponFilterSchema = {
  [ECouponFilterFormKey.Keyword]: '',
  [ECouponFilterFormKey.Type]: ECouponType.All,
  [ECouponFilterFormKey.DateFrom]: '',
  [ECouponFilterFormKey.DateTo]: ''
}

export function meta() {
  return [{ title: 'Coupons · SPECOM HRM' }]
}

/** A real coupon type (not the All filter option) */
const isCouponType = (value: ECouponType): value is Exclude<ECouponType, ECouponType.All> => value !== ECouponType.All

// Manual 3.2.4 Coupons. Spec: GET /saas/admin/coupons (keyword, type, dateFrom, dateTo, active, page zero-based)
export default function CouponsPage() {
  // Lib
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateCoupons()
  const { data: currency } = useDefaultCurrencyApi()

  // Query
  const { searchParams, setQuery, updateQueries } = useQueryParams()
  const [tab, setTab] = useState<ECouponStatusTab>(() => paramsHelper.getCouponTab(searchParams))

  // Table
  const { paging, setPage, setSize, getSearchPaging, getResetPaging, resetPaging, toApiPaging } = usePagination()
  const [formCoupon, setFormCoupon] = useState<ICoupon | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<ICoupon | undefined>()

  const { mutate: toggle, variables: toggling } = useMutationApi({
    mutationFn: ({ coupon, enabled }: { coupon: ICoupon; enabled: boolean }) =>
      CouponService.ChangeStatus(coupon.id ?? '', enabled),
    onSuccess: async (_, { enabled }) => {
      toast.success(t(enabled ? 'coupon.toast.enabled' : 'coupon.toast.disabled'))
      await invalidate()
    }
  })

  const columns = useMemo(
    () =>
      couponMgtColumn.getCoupon(t, getTranslateEnum, currency, {
        onToggle: (coupon, enabled) => toggle({ coupon, enabled }),
        onAction: (action: TCouponAction, coupon) => (action === 'edit' ? setFormCoupon(coupon) : setDeleting(coupon)),
        togglingId: toggling?.coupon.id
      }),
    [t, getTranslateEnum, currency, toggle, toggling]
  )

  // Form
  // URL first, then defaults; an unknown ?type= falls back to All
  const rawUrlValues = formHelper.getDefaultValues(searchParams, DEFAULT_VALUES)
  const urlValues: TCouponFilterSchema = {
    ...rawUrlValues,
    type: commonHelper.toEnumValue(rawUrlValues.type, Object.values(ECouponType), ECouponType.All)
  }
  const form = useForm<TCouponFilterSchema>({
    defaultValues: urlValues,
    resolver: zodResolver(getCouponFilterSchema(t)),
    mode: 'all'
  })

  // Convert data
  const handleConvertData = (
    values: TCouponFilterSchema = form.getValues()
  ): Omit<ICouponListParams, 'active' | 'page' | 'size' | 'sort'> => {
    const { type } = values
    return {
      keyword: values.keyword.trim() || undefined,
      // TODO: send ALL once BE supports it — `type` accepts only PERCENTAGE | FLAT (omitted = all types)
      type: isCouponType(type) ? type : undefined,
      dateFrom: values.dateFrom || undefined,
      dateTo: values.dateTo || undefined
    }
  }
  const appliedFilters = handleConvertData(urlValues)
  const appliedCount = Object.values(appliedFilters).filter(Boolean).length
  const listParams: ICouponListParams = {
    ...toApiPaging(),
    ...appliedFilters,
    // Spec: active true = tab Active, false = Inactive, omitted = All
    active: tab === ECouponStatusTab.All ? undefined : tab === ECouponStatusTab.Active
  }

  // API
  const { dataList, totalPage, totalElement, isLoading, isRefetching } = useGetListCouponApi({ params: listParams })
  const { data: counts } = useGetCouponStatusCountsApi(appliedFilters)

  const { mutate: deleteCoupon, isPending: isDeleting } = useMutationApi({
    mutationFn: (coupon: ICoupon) => CouponService.Delete(coupon.id ?? ''),
    onSuccess: async () => {
      toast.success(t('coupon.toast.deleted'))
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
    updateQueries({ ...getResetPaging(), keyword: undefined, type: undefined, dateFrom: undefined, dateTo: undefined })
  }

  // One URL update (two back-to-back setSearchParams calls overwrite each other)
  const handleTabChange = (next: ECouponStatusTab) => {
    setTab(next)
    updateQueries({ tab: next, page: getSearchPaging().page })
  }

  // Sync data and url
  useEffect(() => {
    setQuery(paramsHelper.couponToSearchParams(searchParams, DEFAULT_VALUES, tab))
  }, [])

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{t('coupon.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('coupon.subtitle')}</p>
        </div>
        <Button className='h-[38px]' onClick={() => setFormCoupon(null)}>
          <Plus />
          {t('coupon.add')}
        </Button>
      </div>

      <CouponFilterBar form={form} appliedCount={appliedCount} onSearch={handleSearch} onReset={handleReset} />

      <TabsCustom
        value={tab}
        onChange={handleTabChange}
        options={DATA.GET_COUPON_STATUS_TABS(t, counts)}
        isNoSyncParams
      />

      {/* Rows open the coupon detail page (manual: View Details) */}
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
        emptyText={appliedCount > 0 ? t('saas.empty_filtered') : t('coupon.empty')}
      />

      <CouponFormDialog coupon={formCoupon} currency={currency} onClose={() => setFormCoupon(undefined)} />
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('coupon.delete.title')}
        description={t('coupon.delete.description', { name: deleting?.name ?? '-', code: deleting?.code ?? '-' })}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && deleteCoupon(deleting)}
      />
    </PageLayout>
  )
}
