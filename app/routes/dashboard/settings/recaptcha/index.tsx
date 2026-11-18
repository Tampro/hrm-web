import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { getRecaptchaSettingsSchema, type TRecaptchaSettingsSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { DATA } from '~/shared/constants/data.constant'
import { ERecaptchaSettingsFormKey } from '~/shared/enums/form.enum'
import { ERecaptchaVersion, ESettingsSection } from '~/shared/enums/settings.enum'
import type { IRecaptchaSettingsPayload, IRecaptchaSettingsView } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

/**
 * The login screen does not send `recaptchaToken` yet, and the backend requires it on POST /auth/login once
 * reCAPTCHA is enabled — enabling it now would lock everyone out. Flip when the login supports it.
 */
const CAN_ENABLE_RECAPTCHA = false

// Spec: GET / PUT /settings/admin/recaptcha — secret is write-only (omitted = keep); enabling needs a secret
// (SETTINGS_006)
export default function RecaptchaSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<IRecaptchaSettingsView, IRecaptchaSettingsPayload>(
    ESettingsSection.Recaptcha
  )
  const form = useForm<TRecaptchaSettingsSchema>({
    defaultValues: { enabled: false, version: ERecaptchaVersion.V2, siteKey: '', secret: '' },
    resolver: zodResolver(getRecaptchaSettingsSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (data)
      form.reset({
        enabled: !!data.enabled,
        version: data.version ?? ERecaptchaVersion.V2,
        siteKey: data.siteKey ?? '',
        secret: ''
      })
  }, [data, form])

  const handleSave = form.handleSubmit((v) =>
    save({
      // never switch it on from here until the login sends a token (see CAN_ENABLE_RECAPTCHA)
      enabled: CAN_ENABLE_RECAPTCHA ? v.enabled : !!data?.enabled && v.enabled,
      version: v.version,
      siteKey: v.siteKey || undefined,
      ...(v.secret ? { secret: v.secret } : {})
    })
  )

  return (
    <SettingsCard
      title={t('settings.section.recaptcha')}
      description={t('settings.recaptcha.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={handleSave}
    >
      {!CAN_ENABLE_RECAPTCHA && (
        <div
          role='note'
          className='flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100'
        >
          <TriangleAlert className='mt-0.5 size-4 shrink-0' />
          <p>{t('settings.recaptcha.locked_warning')}</p>
        </div>
      )}
      <FormSwitchField
        control={form.control}
        name={ERecaptchaSettingsFormKey.Enabled}
        label={t('settings.recaptcha.enabled')}
        description={t('settings.recaptcha.enabled_hint')}
        disabled={!CAN_ENABLE_RECAPTCHA && !data?.enabled}
      />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormSelectField
          control={form.control}
          name={ERecaptchaSettingsFormKey.Version}
          label={t('settings.recaptcha.version')}
          options={DATA.GET_RECAPTCHA_VERSION_OPTIONS()}
        />
        <FormInputField
          control={form.control}
          name={ERecaptchaSettingsFormKey.SiteKey}
          label={t('settings.recaptcha.site_key')}
          autoComplete='off'
        />
      </div>
      <FormInputField
        control={form.control}
        name={ERecaptchaSettingsFormKey.Secret}
        label={t('settings.recaptcha.secret')}
        type='password'
        autoComplete='new-password'
        description={t(data?.secretSet ? 'settings.recaptcha.secret_set' : 'settings.recaptcha.secret_not_set')}
      />
    </SettingsCard>
  )
}
