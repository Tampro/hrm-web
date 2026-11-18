import type { TFunction } from 'i18next'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import type { ICurrency } from '~/shared/models/saas.model'

export type TCurrencyAction = 'view' | 'edit' | 'delete'

const iconAction = (
  label: string,
  icon: ReactNode,
  onClick: () => void,
  opts: { className?: string; disabled?: boolean; hint?: string } = {}
) => (
  <Tooltip>
    {/* span wrapper: a disabled button gets no pointer events, the tooltip still explains why */}
    <TooltipTrigger render={<span />}>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={label}
        className={opts.className}
        disabled={opts.disabled}
        onClick={onClick}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{opts.hint ?? label}</TooltipContent>
  </Tooltip>
)

export const currencyMgtColumn = {
  // Manual 3.2.5 list: name, code, symbol, default (Yes / No), actions (view, edit, delete)
  getCurrency: (
    t: TFunction,
    onAction: (action: TCurrencyAction, currency: ICurrency) => void
  ): IColumn<ICurrency>[] => [
    {
      id: 'name',
      header: t('currency.field.name'),
      cell: (row) => <span className='font-medium'>{row.name || '-'}</span>
    },
    {
      id: 'code',
      header: t('currency.field.code'),
      cell: (row) => <span className='font-mono'>{row.code || '-'}</span>
    },
    { id: 'symbol', header: t('currency.field.symbol'), cell: (row) => row.symbol || '-' },
    {
      id: 'default',
      header: t('currency.field.default'),
      cell: (row) =>
        row.defaultCurrency ? <Badge>{t('common.yes')}</Badge> : <Badge variant='outline'>{t('common.no')}</Badge>
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-32 text-right',
      meta: { disableNavigation: true },
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          {iconAction(t('currency.action.view_named', { name: row.name ?? '' }), <Eye />, () => onAction('view', row))}
          {iconAction(t('currency.action.edit_named', { name: row.name ?? '' }), <Pencil />, () =>
            onAction('edit', row)
          )}
          {/* Spec: SAAS_024 the default currency cannot be deleted */}
          {iconAction(
            t('currency.action.delete_named', { name: row.name ?? '' }),
            <Trash2 />,
            () => onAction('delete', row),
            {
              className: 'text-destructive',
              disabled: !!row.defaultCurrency,
              hint: row.defaultCurrency ? t('currency.default_cannot_delete') : undefined
            }
          )}
        </div>
      )
    }
  ]
}
