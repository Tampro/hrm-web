import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { FieldSeparator } from '~/components/ui/field'
import { getCookieSettingsSchema, type TCookieSettingsSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { ECookieSettingsFormKey } from '~/shared/enums/form.enum'
import { ESettingsSection } from '~/shared/enums/settings.enum'
import type { ICookieSettings } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

const TEXT_KEYS = [
  ECookieSettingsFormKey.CookieTitle,
  ECookieSettingsFormKey.CookieDescription,
  ECookieSettingsFormKey.StrictlyTitle,
  ECookieSettingsFormKey.StrictlyDescription,
  ECookieSettingsFormKey.ContactDescription,
  ECookieSettingsFormKey.ContactUrl
] as const

// Spec: GET / PUT /settings/admin/cookie (CookieSettings) — the cookie banner texts
export default function CookieSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<ICookieSettings, ICookieSettings>(
    ESettingsSection.Cookie
  )
  const form = useForm<TCookieSettingsSchema>({
    defaultValues: {
      enableLogging: false,
      ...Object.fromEntries(TEXT_KEYS.map((k) => [k, '']))
    } as TCookieSettingsSchema,
    resolver: zodResolver(getCookieSettingsSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (data)
      form.reset({
        enableLogging: !!data.enableLogging,
        ...Object.fromEntries(TEXT_KEYS.map((k) => [k, data[k] ?? '']))
      } as TCookieSettingsSchema)
  }, [data, form])

  const handleSave = form.handleSubmit((v) =>
    save({ enableLogging: v.enableLogging, ...Object.fromEntries(TEXT_KEYS.map((k) => [k, v[k] || undefined])) })
  )

  return (
    <SettingsCard
      title={t('settings.section.cookie')}
      description={t('settings.cookie.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={handleSave}
    >
      <FormSwitchField
        control={form.control}
        name={ECookieSettingsFormKey.EnableLogging}
        label={t('settings.cookie.enable_logging')}
        description={t('settings.cookie.enable_logging_hint')}
      />
      <FieldSeparator>{t('settings.cookie.banner')}</FieldSeparator>
      <FormInputField
        control={form.control}
        name={ECookieSettingsFormKey.CookieTitle}
        label={t('settings.cookie.cookie_title')}
      />
      <FormTextareaField
        control={form.control}
        name={ECookieSettingsFormKey.CookieDescription}
        label={t('settings.cookie.cookie_description')}
      />
      <FieldSeparator>{t('settings.cookie.strictly')}</FieldSeparator>
      <FormInputField
        control={form.control}
        name={ECookieSettingsFormKey.StrictlyTitle}
        label={t('settings.cookie.strictly_title')}
      />
      <FormTextareaField
        control={form.control}
        name={ECookieSettingsFormKey.StrictlyDescription}
        label={t('settings.cookie.strictly_description')}
      />
      <FieldSeparator>{t('settings.cookie.contact')}</FieldSeparator>
      <FormTextareaField
        control={form.control}
        name={ECookieSettingsFormKey.ContactDescription}
        label={t('settings.cookie.contact_description')}
      />
      <FormInputField
        control={form.control}
        name={ECookieSettingsFormKey.ContactUrl}
        label={t('settings.cookie.contact_url')}
        placeholder='https://'
        inputMode='url'
      />
    </SettingsCard>
  )
}
