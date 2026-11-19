import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { InfoRows } from '~/components/customs/info-rows'
import { StatCards } from '~/components/customs/stat-cards'
import { buttonVariants } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { AnnouncementTags, getAnnouncementCategoryName } from '~/helpers/columns/announcement-mgt-column'
import { useGetAnnouncementStatisticsApi } from '~/hooks/apis/use-announcement-api'
import { PageLayout } from '~/layouts/page.layout'
import { cn } from '~/lib/utils'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'

export function meta() {
  return [{ title: 'Announcement statistics · SPECOM HRM' }]
}

// Manual 6.3.5 Announcement Statistics: summary + Total Employees, Views, View Rate.
// Spec: GET /org/announcements/{id}/statistics — Total Employees = reached today (not terminated),
// Views = unique employees who opened it, View Rate = Views / Total in percent
export default function AnnouncementStatisticsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { detail: a, isLoading, isError } = useGetAnnouncementStatisticsApi({ id })

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          to={ROUTES.ANNOUNCEMENT_DETAIL(id ?? '')}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
          aria-label={t('announcement.back')}
        >
          <ArrowLeft />
        </Link>
        <div>
          <h1 className='text-xl font-semibold'>{t('announcement.statistics.title')}</h1>
          <p className='text-muted-foreground text-sm'>{a?.title || '-'}</p>
        </div>
      </div>

      {isError ? (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>
          {t('announcement.not_found')}
        </div>
      ) : (
        <>
          <StatCards
            label={t('announcement.statistics.title')}
            items={DATA.GET_ANNOUNCEMENT_STAT_CARDS(t, a?.stats)}
            loading={isLoading}
            className='xl:grid-cols-3'
          />
          <section
            aria-label={t('announcement.statistics.summary')}
            className='bg-card flex flex-col gap-3 rounded-xl border p-5'
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h2 className='text-muted-foreground text-sm font-semibold uppercase'>
                {t('announcement.statistics.summary')}
              </h2>
              {a && <AnnouncementTags announcement={{ featured: a.featured, highPriority: a.highPriority }} t={t} />}
            </div>
            {isLoading ? (
              <Skeleton className='h-40 w-full' />
            ) : (
              <InfoRows rows={DATA.GET_ANNOUNCEMENT_SUMMARY_ROWS(t, a, getAnnouncementCategoryName(t, a?.category))} />
            )}
          </section>
        </>
      )}
    </PageLayout>
  )
}
