import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import {
  getEmailSettingsSchema,
  getTestEmailSchema,
  type TEmailSettingsSchema,
  type TTestEmailSchema
} from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { SettingsService } from '~/services/settings.service'
import { DATA } from '~/shared/constants/data.constant'
import { EEmailSettingsFormKey } from '~/shared/enums/form.enum'
import { EMailEncryption, ESettingsSection } from '~/shared/enums/settings.enum'
import type { IEmailSettingsPayload, IEmailSettingsView } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

const DEFAULT_VALUES: TEmailSettingsSchema = {
  host: '',
  port: '587',
  username: '',
  password: '',
  encryption: EMailEncryption.Tls,
  fromAddress: '',
  fromName: ''
}

/** Spec: POST /settings/admin/email/test — sends a real email with the SAVED settings */
function TestEmailDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const form = useForm<TTestEmailSchema>({
    defaultValues: { testTo: '' },
    resolver: zodResolver(getTestEmailSchema(t)),
    mode: 'all'
  })
  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TTestEmailSchema) => SettingsService.SendTestEmail(values.testTo),
    onSuccess: () => {
      toast.success(t('settings.email.test_sent'))
      onClose()
    }
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isPending && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('settings.email.test_title')}</DialogTitle>
          <DialogDescription>{t('settings.email.test_description')}</DialogDescription>
        </DialogHeader>
        <form id='test-email-form' onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.TestTo}
            label={t('settings.email.test_to')}
            type='email'
            required
          />
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='test-email-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t('settings.email.send_test')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Spec: GET / PUT /settings/admin/email. password is write-only: omitted keeps the stored one, '' removes it.
export default function EmailSettingsPage() {
  const { t } = useTranslation()
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [removePassword, setRemovePassword] = useState(false)
  const { data, isLoading, save, isSaving } = useSettingsSection<IEmailSettingsView, IEmailSettingsPayload>(
    ESettingsSection.Email
  )
  // only meaningful while a password is stored: after it is removed, passwordSet turns false and this resets itself
  const willRemove = removePassword && !!data?.passwordSet
  const form = useForm<TEmailSettingsSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getEmailSettingsSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      host: data.host ?? '',
      port: data.port ? String(data.port) : DEFAULT_VALUES.port,
      username: data.username ?? '',
      password: '',
      encryption: data.encryption ?? DEFAULT_VALUES.encryption,
      fromAddress: data.fromAddress ?? '',
      fromName: data.fromName ?? ''
    })
  }, [data, form])

  const handleSave = form.handleSubmit((values) =>
    save({
      host: values.host,
      port: Number(values.port),
      username: values.username || undefined,
      // empty field = keep the stored password; "remove" sends '' on purpose
      ...(willRemove ? { password: '' } : values.password ? { password: values.password } : {}),
      encryption: values.encryption,
      fromAddress: values.fromAddress,
      fromName: values.fromName || undefined
    })
  )

  return (
    <>
      <SettingsCard
        title={t('settings.section.email')}
        description={t('settings.email.description')}
        loading={isLoading}
        saving={isSaving}
        onSubmit={handleSave}
        actions={
          <Button type='button' variant='outline' className='h-[38px]' onClick={() => setIsTestOpen(true)}>
            <Send />
            {t('settings.email.send_test')}
          </Button>
        }
      >
        <div className='grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.Host}
            label={t('settings.email.host')}
            required
          />
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.Port}
            label={t('settings.email.port')}
            inputMode='numeric'
            required
          />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.Username}
            label={t('settings.email.username')}
            autoComplete='off'
          />
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.Password}
            label={t('settings.email.password')}
            type='password'
            autoComplete='new-password'
            disabled={willRemove}
            description={t(data?.passwordSet ? 'settings.email.password_set' : 'settings.email.password_not_set')}
          />
        </div>
        {data?.passwordSet && (
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={willRemove}
              onChange={(e) => setRemovePassword(e.target.checked)}
              className='accent-primary size-4'
            />
            {t('settings.email.remove_password')}
          </label>
        )}
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormSelectField
            control={form.control}
            name={EEmailSettingsFormKey.Encryption}
            label={t('settings.email.encryption')}
            options={DATA.GET_MAIL_ENCRYPTION_OPTIONS(t)}
          />
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.FromAddress}
            label={t('settings.email.from_address')}
            type='email'
            required
          />
          <FormInputField
            control={form.control}
            name={EEmailSettingsFormKey.FromName}
            label={t('settings.email.from_name')}
          />
        </div>
      </SettingsCard>
      <TestEmailDialog open={isTestOpen} onClose={() => setIsTestOpen(false)} />
    </>
  )
}
