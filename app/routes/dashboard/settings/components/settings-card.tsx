import type { FormEventHandler, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
import { Skeleton } from '~/components/ui/skeleton'

interface IProps {
  title: string
  description?: string
  loading?: boolean
  saving?: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  /** extra buttons next to Save (e.g. Send test email) */
  actions?: ReactNode
  children: ReactNode
}

/** Frame of one settings section: heading, form fields, Save */
export function SettingsCard({ title, description, loading, saving, onSubmit, actions, children }: IProps) {
  const { t } = useTranslation()

  return (
    <form
      aria-label={title}
      className='bg-card flex min-w-0 flex-col gap-6 rounded-xl border p-6'
      onSubmit={onSubmit}
      noValidate
    >
      <header>
        <h2 className='text-lg font-semibold'>{title}</h2>
        {description && <p className='text-muted-foreground text-sm'>{description}</p>}
      </header>
      {loading ? (
        <div className='flex flex-col gap-3'>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className='h-[38px] w-full' />
          ))}
        </div>
      ) : (
        <FieldGroup>{children}</FieldGroup>
      )}
      <footer className='flex flex-wrap justify-end gap-2'>
        {actions}
        <Button type='submit' className='h-[38px]' disabled={loading || saving}>
          {saving ? t('common.saving') : t('settings.save')}
        </Button>
      </footer>
    </form>
  )
}
