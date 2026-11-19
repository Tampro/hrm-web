import { CalendarRange } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { buttonVariants } from '~/components/ui/button'
import { AnnouncementStateBadge, AnnouncementTags } from '~/helpers/columns/announcement-mgt-column'
import { dateHelper } from '~/helpers/date.helper'
import { cn } from '~/lib/utils'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { IAnnouncement } from '~/shared/models/announcement.model'

/** Manual 6.3.5 Dashboard View card: title, short description, dates, content preview, tags, Read More */
export function AnnouncementCard({ announcement: a }: { announcement: IAnnouncement }) {
  const { t } = useTranslation()
  return (
    <article
      aria-label={a.title}
      className={cn(
        'bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-4',
        a.highPriority && 'border-red-200',
        a.featured && 'ring-1 ring-amber-200'
      )}
    >
      <AnnouncementTags announcement={a} t={t} />
      <div className='min-w-0'>
        <h3 className='line-clamp-2 font-semibold'>{a.title || '-'}</h3>
        {a.shortDescription && <p className='text-muted-foreground line-clamp-2 text-sm'>{a.shortDescription}</p>}
      </div>
      <p className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs'>
        <CalendarRange className='size-4' />
        {dateHelper.formatDateRange(a.startDate, a.endDate)}
        <AnnouncementStateBadge state={a.state} t={t} />
      </p>
      {/* Spec: contentPreview is plain text (never HTML) */}
      {a.contentPreview && <p className='line-clamp-3 text-sm'>{a.contentPreview}</p>}
      <Link
        to={ROUTES.ANNOUNCEMENT_DETAIL(a.id ?? '')}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-auto self-start')}
        aria-label={t('announcement.read_more_named', { name: a.title ?? '' })}
      >
        {t('announcement.read_more')}
      </Link>
    </article>
  )
}
