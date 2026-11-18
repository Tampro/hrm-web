import { ArrowLeft, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { InfoRows } from '~/components/customs/info-rows'
import { StatCards } from '~/components/customs/stat-cards'
import { TableCustom } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button, buttonVariants } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { couponMgtColumn } from '~/helpers/columns/coupon-mgt-column'
import { useGetCouponDetailApi } from '~/hooks/apis/use-coupon-api'
import { useDefaultCurrencyApi } from '~/hooks/apis/use-plan-api'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { ICoupon } from '~/shared/models/coupon.model'

import { CouponFormDialog } from '../components/coupon-form-dialog'

// Manual 3.2.4 View Details: summary cards, coupon information, usage history.
// Spec: GET /saas/admin/coupons/{id} → CouponDetailDto { coupon, usageHistory (newest first) }
export default function CouponDetailPage() {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { id } = useParams()
  const { data: currency } = useDefaultCurrencyApi()
  const { detail, isLoading, isError } = useGetCouponDetailApi({ id })
  const [editing, setEditing] = useState<ICoupon | null | undefined>(undefined)
  const coupon = detail?.coupon
  const usage = useMemo(
    () => (detail?.usageHistory ?? []).map((row, index) => ({ ...row, id: row.orderId ?? String(index) })),
    [detail]
  )
  const usageColumns = useMemo(
    () => couponMgtColumn.getCouponUsage(t, getTranslateEnum, currency),
    [t, getTranslateEnum, currency]
  )

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          {/* a real link (navigation), styled as a button — Button render={<Link>} exposed role="button" */}
          <Link
            to={ROUTES.COUPONS}
            className={buttonVariants({ variant: 'outline', size: 'icon' })}
            aria-label={t('coupon.back')}
          >
            <ArrowLeft />
          </Link>
          <div>
            {isLoading ? (
              <Skeleton className='h-7 w-56' />
            ) : (
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-xl font-semibold'>{coupon?.name || '-'}</h1>
                {coupon && (
                  <Badge variant={coupon.enabled ? 'default' : 'secondary'}>
                    {t(coupon.enabled ? 'coupon.tab.active' : 'coupon.tab.inactive')}
                  </Badge>
                )}
              </div>
            )}
            <p className='text-muted-foreground font-mono text-sm'>{coupon?.code || '-'}</p>
          </div>
        </div>
        {coupon && (
          <Button variant='outline' className='h-[38px]' onClick={() => setEditing(coupon)}>
            <Pencil />
            {t('common.edit')}
          </Button>
        )}
      </div>

      {isError && (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>{t('coupon.not_found')}</div>
      )}

      {!isError && (
        <>
          <StatCards
            label={t('coupon.detail.summary')}
            items={DATA.GET_COUPON_SUMMARY_ROWS(t, coupon, currency)}
            loading={isLoading}
          />

          <section className='bg-card flex flex-col gap-3 rounded-xl border p-4'>
            <h2 className='text-base font-semibold'>{t('coupon.detail.information')}</h2>
            {isLoading ? (
              <Skeleton className='h-32 w-full' />
            ) : (
              <InfoRows rows={DATA.GET_COUPON_INFO_ROWS(t, coupon, getTranslateEnum, currency)} />
            )}
          </section>

          <TableCustom
            headerTitle={t('coupon.detail.usage_history')}
            headerDescription={t('coupon.detail.usage_hint')}
            columns={usageColumns}
            data={usage}
            loading={isLoading}
            totalItems={usage.length}
            disableNavigationAll
            emptyText={t('coupon.detail.usage_empty')}
          />
        </>
      )}

      <CouponFormDialog coupon={editing} currency={currency} onClose={() => setEditing(undefined)} />
    </PageLayout>
  )
}
