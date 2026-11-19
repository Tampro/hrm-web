import type { TFunction } from 'i18next'
import { BarChart3, Eye, Paperclip, Pencil, Star, Trash2, TriangleAlert } from 'lucide-react'

import type { IColumn } from '~/components/customs/table-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { dateHelper } from '~/helpers/date.helper'
import { EAnnouncementState } from '~/shared/enums/announcement.enum'
import type { IAnnouncement, IAnnouncementCategory } from '~/shared/models/announcement.model'

export type TAnnouncementAction = 'view' | 'edit' | 'statistics' | 'delete'

/** System categories come in English (General, Policy, Event, HR Update): translated by name, own ones as typed */
export const getAnnouncementCategoryName = (t: TFunction, category?: IAnnouncementCategory | null) =>
  category?.system && category.name
    ? t(`announcement.category.system_name.${category.name.trim().replace(/\s+/g, '_').toUpperCase()}`, {
        defaultValue: category.name
      })
    : category?.name || '-'

/** "Toàn công ty" or the target branches / departments (Spec: companyWide ignores the targets) */
export const getAnnouncementAudience = (t: TFunction, a?: IAnnouncement) =>
  a?.companyWide
    ? t('announcement.company_wide')
    : [...(a?.branches ?? []), ...(a?.departments ?? [])].map((x) => x.name).join(', ') || '-'

const STATE_BADGE: Record<string, string> = {
  [EAnnouncementState.Upcoming]: 'bg-blue-50 text-blue-700 border-blue-200',
  [EAnnouncementState.Active]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [EAnnouncementState.Expired]: 'bg-muted text-muted-foreground'
}

/** State next to the date range (Spec: UPCOMING / ACTIVE / EXPIRED, derived from the dates) */
export function AnnouncementStateBadge({ state, t }: { state?: EAnnouncementState; t: TFunction }) {
  if (!state) return null
  return (
    <Badge variant='outline' className={STATE_BADGE[state]}>
      {t(`announcement.state.${state}`)}
    </Badge>
  )
}

/** Category tag (with its colour) + Featured / High Priority tags */
export function AnnouncementTags({ announcement: a, t }: { announcement?: IAnnouncement; t: TFunction }) {
  return (
    <span className='flex flex-wrap items-center gap-1'>
      {a?.category && (
        <Badge
          variant='outline'
          className='text-white'
          style={{ backgroundColor: a.category.color, borderColor: a.category.color }}
        >
          {getAnnouncementCategoryName(t, a.category)}
        </Badge>
      )}
      {a?.featured && (
        <Badge variant='outline' className='border-amber-200 bg-amber-50 text-amber-700'>
          <Star />
          {t('announcement.tag.featured')}
        </Badge>
      )}
      {a?.highPriority && (
        <Badge variant='outline' className='border-red-200 bg-red-50 text-red-700'>
          <TriangleAlert />
          {t('announcement.tag.high_priority')}
        </Badge>
      )}
    </span>
  )
}

export const announcementMgtColumn = {
  // Manual 6.3.5 list: title (+ Featured / High Priority), category, date range + state, audience, attachments,
  // actions (view, edit, statistics, delete)
  getAnnouncement: (
    t: TFunction,
    onAction: (action: TAnnouncementAction, announcement: IAnnouncement) => void,
    canManage: boolean
  ): IColumn<IAnnouncement>[] => [
    {
      id: 'title',
      header: t('announcement.field.title'),
      cell: (row) => (
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='truncate font-medium'>{row.title || '-'}</span>
          {(row.featured || row.highPriority) && <AnnouncementTags announcement={{ ...row, category: null }} t={t} />}
        </div>
      )
    },
    {
      id: 'category',
      header: t('announcement.field.category'),
      cell: (row) => <AnnouncementTags announcement={{ category: row.category }} t={t} />
    },
    {
      id: 'dates',
      header: t('announcement.field.date_range'),
      cell: (row) => (
        <div className='flex flex-col items-start gap-1'>
          <span>{dateHelper.formatDateRange(row.startDate, row.endDate)}</span>
          <AnnouncementStateBadge state={row.state} t={t} />
        </div>
      )
    },
    {
      id: 'audience',
      header: t('announcement.field.audience'),
      cell: (row) => <span className='line-clamp-2'>{getAnnouncementAudience(t, row)}</span>
    },
    {
      id: 'attachments',
      header: <span className='sr-only'>{t('announcement.field.attachments')}</span>,
      className: 'w-12',
      cell: (row) =>
        row.attachments?.length ? (
          <span
            className='text-muted-foreground inline-flex items-center gap-1 text-sm'
            title={t('announcement.attachments_count', { count: row.attachments.length })}
          >
            <Paperclip className='size-4' />
            {row.attachments.length}
          </span>
        ) : null
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-40 text-right',
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('announcement.action.view_named', { name: row.title ?? '' })}
            onClick={() => onAction('view', row)}
          >
            <Eye />
          </Button>
          {canManage && (
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('announcement.action.edit_named', { name: row.title ?? '' })}
              onClick={() => onAction('edit', row)}
            >
              <Pencil />
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('announcement.action.statistics_named', { name: row.title ?? '' })}
            onClick={() => onAction('statistics', row)}
          >
            <BarChart3 />
          </Button>
          {canManage && (
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-destructive'
              aria-label={t('announcement.action.delete_named', { name: row.title ?? '' })}
              onClick={() => onAction('delete', row)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      )
    }
  ]
}
