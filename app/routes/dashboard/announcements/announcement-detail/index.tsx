import { ArrowLeft, BarChart3, CalendarRange, Download, LayoutGrid, Paperclip, Pencil, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { Button, buttonVariants } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import {
  AnnouncementStateBadge,
  AnnouncementTags,
  getAnnouncementAudience
} from '~/helpers/columns/announcement-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { useGetAnnouncementDetailApi } from '~/hooks/apis/use-announcement-api'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { PageLayout } from '~/layouts/page.layout'
import { cn } from '~/lib/utils'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EAnnouncementView } from '~/shared/enums/announcement.enum'

import { AnnouncementFormDialog } from '../components/announcement-form-dialog'

export function meta() {
  return [{ title: 'Announcement · SPECOM HRM' }]
}

/** List URL of the announcement's company (super admin acts on one company at a time) */
const listUrl = (companyId?: string, view?: EAnnouncementView) => {
  const params = new URLSearchParams()
  if (companyId) params.set('companyId', companyId)
  if (view) params.set('view', view)
  const query = params.toString()
  return query ? `${ROUTES.ANNOUNCEMENTS}?${query}` : ROUTES.ANNOUNCEMENTS
}

// Manual 6.3.5 Announcement Details: Back / Dashboard / Statistics; header, content + attachments, engagement.
// Spec: GET /org/announcements/{id} — content (sanitised HTML), signed attachment links (MEDIA_VIEW), stats
export default function AnnouncementDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data: me } = useMeApi()
  const canManage = !!me?.superAdmin || !!me?.permissions?.includes('ANNOUNCEMENT_MANAGE')
  const { detail: a, isLoading, isError } = useGetAnnouncementDetailApi({ id })
  const [isEditing, setIsEditing] = useState(false)
  const companyId = me?.superAdmin ? a?.companyId : undefined
  const viewRate = a?.stats?.viewRate ?? 0

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Link to={listUrl(companyId)} className={cn(buttonVariants({ variant: 'outline', className: 'h-[38px]' }))}>
          <ArrowLeft />
          {t('announcement.back')}
        </Link>
        {a && (
          <div className='flex flex-wrap gap-2'>
            <Link
              to={listUrl(companyId, EAnnouncementView.Dashboard)}
              className={cn(buttonVariants({ variant: 'outline', className: 'h-[38px]' }))}
            >
              <LayoutGrid />
              {t('announcement.view.dashboard')}
            </Link>
            <Link
              to={ROUTES.ANNOUNCEMENT_STATISTICS(a.id ?? '')}
              className={cn(buttonVariants({ variant: 'outline', className: 'h-[38px]' }))}
            >
              <BarChart3 />
              {t('announcement.statistics.open')}
            </Link>
            {canManage && (
              <Button className='h-[38px]' onClick={() => setIsEditing(true)}>
                <Pencil />
                {t('common.edit')}
              </Button>
            )}
          </div>
        )}
      </div>

      {isError ? (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>
          {t('announcement.not_found')}
        </div>
      ) : isLoading ? (
        <Skeleton className='h-96 w-full' />
      ) : (
        a && (
          <>
            {/* Header: title, short description, dates, audience, tags */}
            <section
              aria-label={t('announcement.detail.header')}
              className='bg-card flex flex-col gap-3 rounded-xl border p-5'
            >
              <AnnouncementTags announcement={a} t={t} />
              <h1 className='text-xl font-semibold break-words'>{a.title || '-'}</h1>
              {a.shortDescription && <p className='text-muted-foreground'>{a.shortDescription}</p>}
              <div className='text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-sm'>
                <span className='flex items-center gap-1.5'>
                  <CalendarRange className='size-4' />
                  {t('announcement.field.start_date')}: {dateHelper.formatDate(a.startDate)} ·{' '}
                  {t('announcement.field.end_date')}: {dateHelper.formatDate(a.endDate)}
                </span>
                <AnnouncementStateBadge state={a.state} t={t} />
                <span className='flex items-center gap-1.5'>
                  <Users className='size-4' />
                  {t('announcement.field.audience')}: {getAnnouncementAudience(t, a)}
                </span>
              </div>
            </section>

            <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'>
              {/* Content: sanitised by the backend, still shown in a sandbox so it can never run script */}
              <section
                aria-label={t('announcement.field.content')}
                className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5'
              >
                <h2 className='text-muted-foreground text-sm font-semibold uppercase'>
                  {t('announcement.field.content')}
                </h2>
                <iframe
                  title={t('announcement.field.content')}
                  sandbox=''
                  srcDoc={a.content ?? ''}
                  className='min-h-80 w-full rounded-md border bg-white'
                />
                {!!a.attachments?.length && (
                  <div className='flex flex-col gap-2'>
                    <h3 className='text-sm font-semibold'>{t('announcement.field.attachments')}</h3>
                    <ul className='flex flex-col gap-1'>
                      {a.attachments.map((f) => (
                        <li
                          key={f.fileId}
                          className='bg-muted/50 flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm'
                        >
                          <span className='flex min-w-0 items-center gap-2'>
                            <Paperclip className='size-4 shrink-0' />
                            <span className='truncate'>{f.name || '-'}</span>
                            <span className='text-muted-foreground shrink-0'>
                              ({commonHelper.formatFileSize(f.sizeBytes)})
                            </span>
                          </span>
                          {/* Spec: links are null without MEDIA_VIEW or when the file is gone */}
                          {f.downloadUrl ? (
                            <a
                              href={f.downloadUrl}
                              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                              aria-label={t('announcement.download_named', { name: f.name ?? '' })}
                            >
                              <Download />
                              {t('announcement.download')}
                            </a>
                          ) : (
                            <span className='text-muted-foreground text-xs'>{t('announcement.no_file_access')}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Engagement: views progress bar + count and percentage */}
              <section
                aria-label={t('announcement.detail.engagement')}
                className='bg-card flex flex-col gap-3 rounded-xl border p-5'
              >
                <h2 className='text-muted-foreground text-sm font-semibold uppercase'>
                  {t('announcement.detail.engagement')}
                </h2>
                <div className='flex items-baseline justify-between text-sm'>
                  <span>
                    {t('announcement.detail.views_of', {
                      views: commonHelper.formatNumber(a.stats?.views, 0),
                      total: commonHelper.formatNumber(a.stats?.totalEmployees, 0)
                    })}
                  </span>
                  <span className='font-semibold'>{commonHelper.formatPercent(viewRate)}</span>
                </div>
                <div
                  role='progressbar'
                  aria-label={t('announcement.stats.view_rate')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={viewRate}
                  className='bg-muted h-2 overflow-hidden rounded-full'
                >
                  <div className='bg-primary h-full rounded-full' style={{ width: `${Math.min(100, viewRate)}%` }} />
                </div>
                <Link
                  to={ROUTES.ANNOUNCEMENT_STATISTICS(a.id ?? '')}
                  className={cn(buttonVariants({ variant: 'outline', className: 'h-[38px]' }))}
                >
                  {t('announcement.statistics.view_detailed')}
                </Link>
              </section>
            </div>
          </>
        )
      )}

      <AnnouncementFormDialog
        announcement={isEditing ? a : undefined}
        companyId={a?.companyId}
        onClose={() => setIsEditing(false)}
      />
    </PageLayout>
  )
}
