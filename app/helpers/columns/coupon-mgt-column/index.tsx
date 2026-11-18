import type { TFunction } from 'i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { DATA } from '~/shared/constants/data.constant'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import type { ICoupon, ICouponUsage } from '~/shared/models/coupon.model'
import type { ICurrency } from '~/shared/models/saas.model'

export type TCouponAction = 'edit' | 'delete'

const iconAction = (label: string, icon: ReactNode, onClick: () => void, className?: string) => (
  <Tooltip>
    <TooltipTrigger
      render={<Button variant='ghost' size='icon-sm' aria-label={label} className={className} onClick={onClick} />}
    >
      {icon}
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)

const limit = (t: TFunction, value: number | null | undefined) =>
  value === null || value === undefined ? t('plan.unlimited') : commonHelper.formatNumber(value, 0)

const USAGE_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [ESaasRequestStatus.Pending]: 'secondary',
  [ESaasRequestStatus.Approved]: 'default',
  [ESaasRequestStatus.Rejected]: 'destructive',
  [ESaasRequestStatus.Cancelled]: 'outline'
}

export const couponMgtColumn = {
  // Manual 3.2.4 list: name, code, type, min / max spend, discount, coupon limit, user limit, expiry, status, actions.
  // Rows open the detail page (View Details); the status switch and actions don't.
  getCoupon: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    currency: ICurrency | undefined,
    handlers: {
      onToggle: (coupon: ICoupon, enabled: boolean) => void
      onAction: (action: TCouponAction, coupon: ICoupon) => void
      togglingId?: string
    }
  ): IColumn<ICoupon>[] => [
    {
      id: 'name',
      header: t('coupon.field.name'),
      cell: (row) => <span className='font-medium'>{row.name || '-'}</span>
    },
    {
      id: 'code',
      header: t('coupon.field.code'),
      cell: (row) => <span className='font-mono text-xs'>{row.code || '-'}</span>
    },
    { id: 'type', header: t('coupon.field.type'), cell: (row) => getTranslateEnum(row.type) },
    {
      id: 'minimumSpend',
      header: t('coupon.field.minimum_spend'),
      className: 'text-right',
      cell: (row) => DATA.FORMAT_OPTIONAL_MONEY(t, row.minimumSpend, currency)
    },
    {
      id: 'maximumSpend',
      header: t('coupon.field.maximum_spend'),
      className: 'text-right',
      cell: (row) => DATA.FORMAT_OPTIONAL_MONEY(t, row.maximumSpend, currency)
    },
    {
      id: 'discount',
      header: t('coupon.field.discount'),
      className: 'text-right font-medium',
      cell: (row) => DATA.FORMAT_COUPON_DISCOUNT(row, currency)
    },
    {
      id: 'useLimitTotal',
      header: t('coupon.field.coupon_limit'),
      className: 'text-right',
      cell: (row) => `${commonHelper.formatNumber(row.timesUsed ?? null, 0)} / ${limit(t, row.useLimitTotal)}`
    },
    {
      id: 'useLimitPerCompany',
      header: t('coupon.field.user_limit'),
      className: 'text-right',
      cell: (row) => limit(t, row.useLimitPerCompany)
    },
    {
      id: 'expiryDate',
      header: t('coupon.field.expiry_date'),
      cell: (row) => (row.expiryDate ? dateHelper.formatDate(row.expiryDate) : t('coupon.no_expiry'))
    },
    {
      id: 'status',
      header: t('coupon.field.status'),
      meta: { disableNavigation: true },
      cell: (row) => (
        <Switch
          checked={!!row.enabled}
          disabled={handlers.togglingId === row.id}
          onCheckedChange={(checked) => handlers.onToggle(row, checked)}
          aria-label={t('coupon.field.active_for', { name: row.name ?? '' })}
        />
      )
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-24 text-right',
      meta: { disableNavigation: true },
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          {iconAction(t('coupon.action.edit_named', { name: row.name ?? '' }), <Pencil />, () =>
            handlers.onAction('edit', row)
          )}
          {iconAction(
            t('coupon.action.delete_named', { name: row.name ?? '' }),
            <Trash2 />,
            () => handlers.onAction('delete', row),
            'text-destructive'
          )}
        </div>
      )
    }
  ],

  // Manual 3.2.4 Usage History: user (company) name + email, order, order amount, discount applied, used at
  getCouponUsage: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    currency: ICurrency | undefined
  ): IColumn<ICouponUsage & { id?: string }>[] => [
    {
      id: 'company',
      header: t('coupon.usage.company'),
      cell: (row) => (
        <div className='flex min-w-44 flex-col'>
          <span className='font-medium'>{row.companyName || '-'}</span>
          <span className='text-muted-foreground text-xs'>{row.companyEmail || '-'}</span>
        </div>
      )
    },
    {
      id: 'orderNumber',
      header: t('coupon.usage.order'),
      cell: (row) => <span className='font-mono text-xs'>{row.orderNumber || '-'}</span>
    },
    {
      id: 'orderAmount',
      header: t('coupon.usage.order_amount'),
      className: 'text-right',
      cell: (row) => commonHelper.formatMoney(row.orderAmount, currency)
    },
    {
      id: 'discountApplied',
      header: t('coupon.usage.discount_applied'),
      className: 'text-right',
      cell: (row) => commonHelper.formatMoney(row.discountApplied, currency)
    },
    {
      id: 'finalPrice',
      header: t('order.field.final_price'),
      className: 'text-right font-medium',
      cell: (row) => commonHelper.formatMoney(row.finalPrice, currency)
    },
    {
      id: 'status',
      header: t('order.field.status'),
      cell: (row) =>
        row.status ? (
          <Badge variant={USAGE_STATUS_VARIANT[row.status] ?? 'outline'}>{getTranslateEnum(row.status)}</Badge>
        ) : (
          '-'
        )
    },
    { id: 'usedAt', header: t('coupon.usage.used_at'), cell: (row) => dateHelper.formatDateTime(row.usedAt) }
  ]
}
