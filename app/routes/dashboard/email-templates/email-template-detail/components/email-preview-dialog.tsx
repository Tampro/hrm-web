import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { EmailTemplateService } from '~/services/email-template.service'
import { DATA } from '~/shared/constants/data.constant'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

interface IProps {
  templateId?: string
  /** language to preview; undefined = closed */
  lang?: string
  onClose: () => void
}

// Spec: GET /{id}/preview/{lang} — the SAVED text with sample values ([variable]); EMAIL_002 when nothing saved yet
export function EmailPreviewDialog({ templateId, lang, onClose }: IProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY.EMAIL_TEMPLATE.GET_PREVIEW, templateId, lang],
    queryFn: () => EmailTemplateService.Preview(templateId as string, lang as string),
    enabled: !!templateId && !!lang,
    select: (res) => res?.data
  })

  return (
    <Dialog open={!!lang} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{t('email_template.preview.title')}</DialogTitle>
          <DialogDescription>{t('email_template.preview.description')}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className='h-64 w-full' />
        ) : (
          <div className='flex min-w-0 flex-col gap-3'>
            <InfoRows rows={DATA.GET_EMAIL_PREVIEW_ROWS(t, data)} />
            {/* sandbox without allow-scripts: the stored HTML is shown, never run */}
            <iframe
              title={t('email_template.preview.body')}
              sandbox=''
              srcDoc={data?.html ?? ''}
              className='h-96 w-full rounded-md border bg-white'
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
