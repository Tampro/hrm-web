import type { TFunction } from 'i18next'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import type { IColumn } from '~/components/customs/table-custom'
import { Button } from '~/components/ui/button'
import { dateHelper } from '~/helpers/date.helper'
import type { IHoliday, IHolidayCategory } from '~/shared/models/holiday.model'

/** System categories come in English from the backend: translated by name, the company's own are shown as typed */
export const getHolidayCategoryName = (t: TFunction, category?: IHolidayCategory | null) =>
  category?.system && category.name
    ? t(`holiday.category.system_name.${category.name.trim().replace(/\s+/g, '_').toUpperCase()}`, {
        defaultValue: category.name
      })
    : category?.name || '-'

export type THolidayAction = 'view' | 'edit' | 'delete'

/** Category name with its legend colour dot (Spec: CategoryDto.color) */
export function HolidayCategoryTag({ category, t }: { category?: IHolidayCategory | null; t: TFunction }) {
  if (!category) return <>-</>
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span aria-hidden className='size-2.5 shrink-0 rounded-full' style={{ backgroundColor: category.color }} />
      {getHolidayCategoryName(t, category)}
    </span>
  )
}

export const holidayMgtColumn = {
  // Manual 6.3.4 list: holiday name, date, category, branches, actions (view, edit, delete)
  getHoliday: (
    t: TFunction,
    onAction: (action: THolidayAction, holiday: IHoliday) => void,
    canManage: boolean
  ): IColumn<IHoliday>[] => [
    {
      id: 'name',
      header: t('holiday.field.name'),
      cell: (row) => (
        <div className='min-w-0'>
          <p className='truncate font-medium'>{row.name || '-'}</p>
          {row.description && <p className='text-muted-foreground truncate text-xs'>{row.description}</p>}
        </div>
      )
    },
    {
      id: 'date',
      header: t('holiday.field.date'),
      cell: (row) => (
        <div>
          <p>{dateHelper.formatDateRange(row.startDate, row.endDate)}</p>
          {!!row.days && row.days > 1 && (
            <p className='text-muted-foreground text-xs'>{t('holiday.days_count', { count: row.days })}</p>
          )}
        </div>
      )
    },
    {
      id: 'category',
      header: t('holiday.field.category'),
      cell: (row) => <HolidayCategoryTag category={row.category} t={t} />
    },
    {
      id: 'branches',
      header: t('holiday.field.branches'),
      cell: (row) =>
        row.allBranches ? (
          <span className='text-muted-foreground'>{t('holiday.all_branches')}</span>
        ) : (
          <span className='line-clamp-2'>{(row.branches ?? []).map((b) => b.name).join(', ') || '-'}</span>
        )
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-32 text-right',
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('holiday.action.view_named', { name: row.name ?? '' })}
            onClick={() => onAction('view', row)}
          >
            <Eye />
          </Button>
          {canManage && (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('holiday.action.edit_named', { name: row.name ?? '' })}
                onClick={() => onAction('edit', row)}
              >
                <Pencil />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-destructive'
                aria-label={t('holiday.action.delete_named', { name: row.name ?? '' })}
                onClick={() => onAction('delete', row)}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]
}
