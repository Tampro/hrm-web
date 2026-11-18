import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { useLastDefined } from '~/hooks/use-last-defined'
import type { ICompanyCreated } from '~/shared/models/company.model'

interface IProps {
  created: ICompanyCreated | undefined
  onClose: () => void
}

/** Spec: the administrator's temporary password is returned once — show it now, it can't be fetched again */
export function TemporaryPasswordDialog({ created: createdProp, onClose }: IProps) {
  const created = useLastDefined(createdProp)
  const { t } = useTranslation()
  const password = created?.admin?.temporaryPassword

  const handleCopy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.copy_failed'))
    }
  }

  return (
    <Dialog open={!!createdProp} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('company.temp_password.title')}</DialogTitle>
          <DialogDescription>{t('company.temp_password.description')}</DialogDescription>
        </DialogHeader>
        <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
          <dt className='text-muted-foreground'>{t('company.field.name')}</dt>
          <dd className='font-medium'>{created?.company?.name || '-'}</dd>
          <dt className='text-muted-foreground'>{t('company.field.admin_username')}</dt>
          <dd className='font-medium'>{created?.admin?.user?.username || '-'}</dd>
          <dt className='text-muted-foreground'>{t('company.temp_password.password')}</dt>
          <dd className='flex items-center gap-2'>
            <code className='bg-muted rounded px-2 py-1 font-mono' data-testid='temporary-password'>
              {password || '-'}
            </code>
            {password && (
              <Button variant='ghost' size='icon-sm' onClick={handleCopy} aria-label={t('common.copy')}>
                <Copy />
              </Button>
            )}
          </dd>
        </dl>
        <DialogFooter>
          <Button className='h-[38px]' onClick={onClose}>
            {t('company.temp_password.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
