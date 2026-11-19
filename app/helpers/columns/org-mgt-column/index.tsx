import type { TFunction } from 'i18next'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import type { IColumn } from '~/components/customs/table-custom'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { dateHelper } from '~/helpers/date.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IBranch, IDepartment } from '~/shared/models/org.model'

export type TDepartmentAction = 'select' | 'edit' | 'delete'

export type TBranchAction = 'view' | 'edit' | 'delete'

interface IBranchColumnOptions {
  onAction: (action: TBranchAction, branch: IBranch) => void
  onToggle: (branch: IBranch, active: boolean) => void
  /** ORG_MANAGE: switch and edit / delete are shown only with it */
  canManage: boolean
  togglingId?: string
}

export const orgMgtColumn = {
  // Branches list: name, address, contact, status (switch), created, actions (view, edit, delete)
  getBranch: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    { onAction, onToggle, canManage, togglingId }: IBranchColumnOptions
  ): IColumn<IBranch>[] => [
    {
      id: 'name',
      header: t('branch.field.name'),
      cell: (row) => <span className='font-medium'>{row.name || '-'}</span>
    },
    {
      id: 'address',
      header: t('branch.field.address'),
      cell: (row) => [row.address, row.city, row.country].filter(Boolean).join(', ') || '-'
    },
    {
      id: 'contact',
      header: t('branch.field.contact'),
      cell: (row) => (
        <div className='min-w-0'>
          <p className='truncate'>{row.phone || '-'}</p>
          <p className='text-muted-foreground truncate text-xs'>{row.email || '-'}</p>
        </div>
      )
    },
    {
      id: 'status',
      header: t('branch.field.status'),
      meta: { disableNavigation: true },
      cell: (row) => {
        const active = row.status === EOrgStatus.Active
        return canManage ? (
          <div className='flex items-center gap-2'>
            <Switch
              checked={active}
              disabled={togglingId === row.id}
              onCheckedChange={(checked) => onToggle(row, checked)}
              aria-label={t('branch.action.toggle_named', { name: row.name ?? '' })}
            />
            <span className='text-sm'>{getTranslateEnum(row.status)}</span>
          </div>
        ) : (
          getTranslateEnum(row.status)
        )
      }
    },
    {
      id: 'createdDate',
      header: t('branch.field.created_at'),
      cell: (row) => dateHelper.formatDate(row.createdDate)
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-32 text-right',
      meta: { disableNavigation: true },
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('branch.action.view_named', { name: row.name ?? '' })}
            onClick={() => onAction('view', row)}
          >
            <Eye />
          </Button>
          {canManage && (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('branch.action.edit_named', { name: row.name ?? '' })}
                onClick={() => onAction('edit', row)}
              >
                <Pencil />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-destructive'
                aria-label={t('branch.action.delete_named', { name: row.name ?? '' })}
                onClick={() => onAction('delete', row)}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      )
    }
  ],

  // Departments list (design CmsPhongBan): name opens the side panel, branch, status (switch), created, actions
  getDepartment: (
    t: TFunction,
    getTranslateEnum: TGetTranslateEnumFn,
    {
      onAction,
      onToggle,
      canManage,
      togglingId
    }: {
      onAction: (action: TDepartmentAction, department: IDepartment) => void
      onToggle: (department: IDepartment, active: boolean) => void
      canManage: boolean
      togglingId?: string
    }
  ): IColumn<IDepartment>[] => [
    {
      id: 'name',
      header: t('department.field.name'),
      cell: (row) => (
        <button
          type='button'
          className='hover:text-primary min-w-0 text-left'
          aria-label={t('department.action.select_named', { name: row.name ?? '' })}
          onClick={() => onAction('select', row)}
        >
          <span className='block truncate font-medium'>{row.name || '-'}</span>
          {row.description && <span className='text-muted-foreground block truncate text-xs'>{row.description}</span>}
        </button>
      )
    },
    { id: 'branch', header: t('department.field.branch'), cell: (row) => row.branch?.name || '-' },
    {
      id: 'status',
      header: t('department.field.status'),
      cell: (row) =>
        canManage ? (
          <div className='flex items-center gap-2'>
            <Switch
              checked={row.status === EOrgStatus.Active}
              disabled={togglingId === row.id}
              onCheckedChange={(checked) => onToggle(row, checked)}
              aria-label={t('department.action.toggle_named', { name: row.name ?? '' })}
            />
            <span className='text-sm'>{getTranslateEnum(row.status)}</span>
          </div>
        ) : (
          getTranslateEnum(row.status)
        )
    },
    {
      id: 'createdDate',
      header: t('department.field.created_at'),
      cell: (row) => dateHelper.formatDate(row.createdDate)
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-24 text-right',
      cell: (row) =>
        canManage && (
          <div className='flex justify-end gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('department.action.edit_named', { name: row.name ?? '' })}
              onClick={() => onAction('edit', row)}
            >
              <Pencil />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-destructive'
              aria-label={t('department.action.delete_named', { name: row.name ?? '' })}
              onClick={() => onAction('delete', row)}
            >
              <Trash2 />
            </Button>
          </div>
        )
    }
  ]
}
