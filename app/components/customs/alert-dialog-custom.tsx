import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmText?: ReactNode
  /** Red confirm button for destructive actions */
  isDestructive?: boolean
  loading?: boolean
  onConfirm: () => void
}

/** Confirmation step for writes (delete, disable login…) */
export function AlertDialogCustom({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  isDestructive,
  loading,
  onConfirm
}: IProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={loading}
            // the dialog stays open until the caller closes it (after the request settles)
            onClick={onConfirm}
          >
            {confirmText ?? t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
