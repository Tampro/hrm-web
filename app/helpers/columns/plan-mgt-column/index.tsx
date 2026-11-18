import type { TFunction } from 'i18next'
import { Check, Eye, X } from 'lucide-react'
import type { ReactNode } from 'react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import type { IAdminOrder, ICurrency, IPlanRequest } from '~/shared/models/saas.model'

export type TDecision = 'approve' | 'reject'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [ESaasRequestStatus.Pending]: 'secondary',
  [ESaasRequestStatus.Approved]: 'default',
  [ESaasRequestStatus.Rejected]: 'destructive',
  [ESaasRequestStatus.Cancelled]: 'outline'
}

const statusBadge = (status: string | undefined, getTranslateEnum: TGetTranslateEnumFn) =>
  status ? <Badge variant={STATUS_VARIANT[status] ?? 'outline'}>{getTranslateEnum(status)}</Badge> : '-'

const companyCell = (name?: string, email?: string) => (
  <div className='flex min-w-44 flex-col'>
    <span className='font-medium'>{name || '-'}</span>
    <span className='text-muted-foreground text-xs'>{email || '-'}</span>
  </div>
)

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

/** Approve / Reject — only for PENDING rows (Spec: SAAS_009 / SAAS_017) */
const decisionActions = (
  t: TFunction,
  status: string | undefined,
  label: string,
  onDecision: (decision: TDecision) => void
) =>
  status === ESaasRequestStatus.Pending ? (
    <>
      {iconAction(
        t('saas.action.approve_named', { name: label }),
        <Check />,
        () => onDecision('approve'),
        'text-primary'
      )}
      {iconAction(
        t('saas.action.reject_named', { name: label }),
        <X />,
        () => onDecision('reject'),
        'text-destructive'
      )}
    </>
  ) : null

export const planMgtColumn = {
  // Manual 3.2.3 Plan Requests: company, plan, duration, status, request date, actions (pending only)
  getPlanRequest: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    onDecision: (decision: TDecision, request: IPlanRequest) => void
  ): IColumn<IPlanRequest>[] => [
    { id: 'company', header: t('saas.field.company'), cell: (row) => companyCell(row.companyName, row.companyEmail) },
    { id: 'plan', header: t('saas.field.plan'), cell: (row) => row.planName || '-' },
    { id: 'billingCycle', header: t('saas.field.duration'), cell: (row) => getTranslateEnum(row.billingCycle) },
    {
      id: 'message',
      header: t('saas.field.message'),
      className: 'max-w-64',
      cell: (row) => <span className='line-clamp-2 break-words'>{row.message || '-'}</span>
    },
    { id: 'status', header: t('saas.field.status'), cell: (row) => statusBadge(row.status, getTranslateEnum) },
    { id: 'createdDate', header: t('saas.field.request_date'), cell: (row) => dateHelper.formatDate(row.createdDate) },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-24 text-right',
      meta: { disableNavigation: true },
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          {decisionActions(t, row.status, row.companyName ?? '', (decision) => onDecision(decision, row))}
        </div>
      )
    }
  ],

  // Manual 3.2.3 Plan Orders: order number, company, plan, original price, discount, final price, status, date, actions
  getOrder: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    currency: ICurrency | undefined,
    onAction: (action: TDecision | 'view', row: IAdminOrder) => void
  ): IColumn<IAdminOrder & { id?: string }>[] => [
    {
      id: 'orderNumber',
      header: t('order.field.order_number'),
      cell: (row) => <span className='font-mono text-xs'>{row.order?.orderNumber || '-'}</span>
    },
    { id: 'company', header: t('order.field.company'), cell: (row) => companyCell(row.companyName, row.companyEmail) },
    {
      id: 'plan',
      header: t('order.field.plan'),
      cell: (row) => (
        <div className='flex flex-col'>
          <span>{row.planName || '-'}</span>
          <span className='text-muted-foreground text-xs'>{getTranslateEnum(row.order?.billingCycle)}</span>
        </div>
      )
    },
    {
      id: 'originalPrice',
      header: t('order.field.original_price'),
      className: 'text-right',
      cell: (row) => commonHelper.formatMoney(row.order?.originalPrice, currency)
    },
    {
      id: 'discount',
      header: t('order.field.discount'),
      className: 'text-right',
      cell: (row) => commonHelper.formatMoney(row.order?.discountAmount, currency)
    },
    {
      id: 'finalPrice',
      header: t('order.field.final_price'),
      className: 'text-right font-medium',
      cell: (row) => commonHelper.formatMoney(row.order?.finalPrice, currency)
    },
    { id: 'status', header: t('order.field.status'), cell: (row) => statusBadge(row.order?.status, getTranslateEnum) },
    {
      id: 'createdDate',
      header: t('order.field.order_date'),
      cell: (row) => dateHelper.formatDate(row.order?.createdDate)
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-32 text-right',
      meta: { disableNavigation: true },
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          {iconAction(t('order.action.view_named', { number: row.order?.orderNumber ?? '' }), <Eye />, () =>
            onAction('view', row)
          )}
          {decisionActions(t, row.order?.status, row.order?.orderNumber ?? '', (decision) => onAction(decision, row))}
        </div>
      )
    }
  ]
}
