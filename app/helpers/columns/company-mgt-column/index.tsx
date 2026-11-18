import type { TFunction } from 'i18next'
import { Ban, CheckCircle2, Info, KeyRound, MoreHorizontal, Pencil, Rocket, Trash2 } from 'lucide-react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { dateHelper } from '~/helpers/date.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { ECompanyStatus, ESubscriptionStatus } from '~/shared/enums/company.enum'
import type { ICompany } from '~/shared/models/company.model'

export type TCompanyAction = 'info' | 'edit' | 'upgrade' | 'reset-password' | 'toggle-status' | 'delete'

const SUBSCRIPTION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [ESubscriptionStatus.Active]: 'default',
  [ESubscriptionStatus.Trial]: 'secondary',
  [ESubscriptionStatus.Expired]: 'destructive',
  [ESubscriptionStatus.None]: 'outline'
}

export const companyMgtColumn = {
  getCompany: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    onAction: (action: TCompanyAction, company: ICompany) => void
  ): IColumn<ICompany>[] => [
    {
      id: 'name',
      header: t('company.field.name'),
      cell: (row) => (
        <div className='flex min-w-48 flex-col'>
          <span className='font-medium'>{row.name || '-'}</span>
          <span className='text-muted-foreground text-xs'>{row.email || '-'}</span>
        </div>
      )
    },
    { id: 'code', header: t('company.field.code'), cell: (row) => row.code || '-' },
    {
      id: 'plan',
      header: t('company.field.plan'),
      cell: (row) => (
        <div className='flex items-center gap-2'>
          <span>{row.planName || '-'}</span>
          {row.subscriptionStatus && (
            <Badge variant={SUBSCRIPTION_VARIANT[row.subscriptionStatus] ?? 'outline'}>
              {getTranslateEnum(row.subscriptionStatus)}
            </Badge>
          )}
        </div>
      )
    },
    {
      id: 'status',
      header: t('company.field.status'),
      cell: (row) => (
        <Badge variant={row.status === ECompanyStatus.Active ? 'default' : 'destructive'}>
          {getTranslateEnum(row.status)}
        </Badge>
      )
    },
    { id: 'createdDate', header: t('company.field.created_at'), cell: (row) => dateHelper.formatDate(row.createdDate) },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-12 text-right',
      meta: { disableNavigation: true },
      cell: (row) => {
        const isActive = row.status === ECompanyStatus.Active
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('company.action.menu', { name: row.name ?? '' })}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuItem onClick={() => onAction('info', row)}>
                <Info />
                {t('company.action.info')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('edit', row)}>
                <Pencil />
                {t('company.action.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('upgrade', row)}>
                <Rocket />
                {t('company.action.upgrade')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('reset-password', row)}>
                <KeyRound />
                {t('company.action.reset_password')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('toggle-status', row)}>
                {isActive ? <Ban /> : <CheckCircle2 />}
                {isActive ? t('company.action.disable_login') : t('company.action.enable_login')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive' onClick={() => onAction('delete', row)}>
                <Trash2 />
                {t('company.action.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}
