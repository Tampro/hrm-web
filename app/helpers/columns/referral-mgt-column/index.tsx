import type { TFunction } from 'i18next'
import { Check, History, X } from 'lucide-react'
import type { ReactNode } from 'react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import type { TDecision } from '~/helpers/columns/plan-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { EPayoutStatus } from '~/shared/enums/referral.enum'
import type { ICommission, IPayout, IReferredCompany, ITopReferrer } from '~/shared/models/referral.model'
import type { ICurrency } from '~/shared/models/saas.model'

const PAYOUT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  [EPayoutStatus.Pending]: 'secondary',
  [EPayoutStatus.Approved]: 'default',
  [EPayoutStatus.Rejected]: 'destructive'
}

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

export const referralMgtColumn = {
  // Dashboard → Top Referring Companies: name + email, referrals, commission earned
  getTopReferrer: (t: TFunction, currency: ICurrency | undefined): IColumn<ITopReferrer & { id?: string }>[] => [
    {
      id: 'company',
      header: t('referral.field.company'),
      cell: (row) => companyCell(row.companyName, row.companyEmail)
    },
    {
      id: 'referrals',
      header: t('referral.field.referrals'),
      className: 'text-right',
      cell: (row) => commonHelper.formatNumber(row.referrals ?? null, 0)
    },
    {
      id: 'commissionEarned',
      header: t('referral.field.commission_earned'),
      className: 'text-right font-medium',
      cell: (row) => commonHelper.formatMoney(row.commissionEarned, currency)
    }
  ],

  // Referred Users list: company + email, registration date, referrer, plan, plan price, commission, history
  getReferred: (
    t: TFunction,
    currency: ICurrency | undefined,
    onHistory: (row: IReferredCompany) => void
  ): IColumn<IReferredCompany & { id?: string }>[] => [
    {
      id: 'company',
      header: t('referral.field.company'),
      cell: (row) => companyCell(row.companyName, row.companyEmail)
    },
    {
      id: 'registeredAt',
      header: t('referral.field.registered_at'),
      cell: (row) => dateHelper.formatDate(row.registeredAt)
    },
    { id: 'referrer', header: t('referral.field.referrer'), cell: (row) => row.referrerName || '-' },
    { id: 'plan', header: t('referral.field.plan'), cell: (row) => row.planName || t('referral.no_plan') },
    {
      id: 'planMonthlyPrice',
      header: t('referral.field.plan_price'),
      className: 'text-right',
      cell: (row) => commonHelper.formatMoney(row.planMonthlyPrice, currency)
    },
    {
      id: 'commission',
      header: t('referral.field.commission'),
      className: 'text-right font-medium',
      cell: (row) => commonHelper.formatMoney(row.commission, currency)
    },
    {
      id: 'history',
      header: <span className='sr-only'>{t('referral.field.commission_history')}</span>,
      className: 'w-16 text-right',
      meta: { disableNavigation: true },
      cell: (row) =>
        iconAction(
          t('referral.action.history_named', {
            name: row.companyName ?? '',
            count: row.commissionHistory?.length ?? 0
          }),
          <History />,
          () => onHistory(row)
        )
    }
  ],

  // Commission history of one referred company: order, order amount, percentage, commission, date
  getCommission: (t: TFunction, currency: ICurrency | undefined): IColumn<ICommission & { id?: string }>[] => [
    { id: 'createdDate', header: t('referral.field.date'), cell: (row) => dateHelper.formatDate(row.createdDate) },
    {
      id: 'orderAmount',
      header: t('referral.field.order_amount'),
      className: 'text-right',
      cell: (row) => commonHelper.formatMoney(row.orderAmount, currency)
    },
    {
      id: 'commissionPercentage',
      header: t('referral.field.percentage'),
      className: 'text-right',
      cell: (row) => commonHelper.formatPercent(row.commissionPercentage)
    },
    {
      id: 'amount',
      header: t('referral.field.commission'),
      className: 'text-right font-medium',
      cell: (row) => commonHelper.formatMoney(row.amount, currency)
    }
  ],

  // Payout Requests: company + email, amount, status, date, note, actions (pending only)
  getPayout: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    currency: ICurrency | undefined,
    onDecision: (decision: TDecision, payout: IPayout) => void
  ): IColumn<IPayout>[] => [
    {
      id: 'company',
      header: t('referral.field.company'),
      cell: (row) => companyCell(row.companyName, row.companyEmail)
    },
    {
      id: 'amount',
      header: t('referral.field.amount'),
      className: 'text-right font-medium',
      cell: (row) => commonHelper.formatMoney(row.amount, currency)
    },
    {
      id: 'status',
      header: t('referral.field.status'),
      cell: (row) =>
        row.status ? (
          <Badge variant={PAYOUT_STATUS_VARIANT[row.status] ?? 'outline'}>{getTranslateEnum(row.status)}</Badge>
        ) : (
          '-'
        )
    },
    { id: 'createdDate', header: t('referral.field.date'), cell: (row) => dateHelper.formatDate(row.createdDate) },
    {
      id: 'notes',
      header: t('referral.field.notes'),
      className: 'max-w-64',
      cell: (row) => <span className='line-clamp-2 break-words'>{row.notes || '-'}</span>
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-24 text-right',
      meta: { disableNavigation: true },
      // Spec: SAAS_031 only pending payouts can be approved or rejected
      cell: (row) =>
        row.status === EPayoutStatus.Pending ? (
          <div className='flex justify-end gap-1'>
            {iconAction(
              t('saas.action.approve_named', { name: row.companyName ?? '' }),
              <Check />,
              () => onDecision('approve', row),
              'text-primary'
            )}
            {iconAction(
              t('saas.action.reject_named', { name: row.companyName ?? '' }),
              <X />,
              () => onDecision('reject', row),
              'text-destructive'
            )}
          </div>
        ) : null
    }
  ]
}
