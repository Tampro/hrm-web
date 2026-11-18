import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { getSystemSettingsSchema, type TSystemSettingsSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { DATA } from '~/shared/constants/data.constant'
import { ESystemSettingsFormKey } from '~/shared/enums/form.enum'
import { ESettingsSection, EWeekDay } from '~/shared/enums/settings.enum'
import type { ISystemSettings } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

const DEFAULT_VALUES: TSystemSettingsSchema = {
  defaultLanguage: 'vi',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  calendarStartDay: EWeekDay.Monday,
  defaultTimezone: 'Asia/Ho_Chi_Minh',
  emailVerification: false,
  landingPage: false,
  userRegistration: false,
  termsUrl: ''
}

// Spec: GET / PUT /settings/admin/system (SystemSettings)
export default function SystemSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<ISystemSettings, ISystemSettings>(
    ESettingsSection.System
  )
  const form = useForm<TSystemSettingsSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getSystemSettingsSchema(t)),
    mode: 'all'
  })
  const timezone = useWatch({ control: form.control, name: ESystemSettingsFormKey.DefaultTimezone })
  const timezoneOptions = useMemo(() => DATA.GET_TIMEZONE_OPTIONS(timezone), [timezone])

  useEffect(() => {
    if (data) form.reset({ ...DEFAULT_VALUES, ...data, termsUrl: data.termsUrl ?? '' } as TSystemSettingsSchema)
  }, [data, form])

  return (
    <SettingsCard
      title={t('settings.section.system')}
      description={t('settings.system.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={form.handleSubmit((values) => save({ ...values, termsUrl: values.termsUrl || undefined }))}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormSelectField
          control={form.control}
          name={ESystemSettingsFormKey.DefaultLanguage}
          label={t('settings.system.default_language')}
          options={DATA.GET_LANGUAGE_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={ESystemSettingsFormKey.DefaultTimezone}
          label={t('settings.system.default_timezone')}
          options={timezoneOptions}
        />
        <FormSelectField
          control={form.control}
          name={ESystemSettingsFormKey.DateFormat}
          label={t('settings.system.date_format')}
          options={DATA.GET_DATE_FORMAT_OPTIONS()}
        />
        <FormSelectField
          control={form.control}
          name={ESystemSettingsFormKey.TimeFormat}
          label={t('settings.system.time_format')}
          options={DATA.GET_TIME_FORMAT_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={ESystemSettingsFormKey.CalendarStartDay}
          label={t('settings.system.calendar_start_day')}
          options={DATA.GET_WEEK_DAY_OPTIONS(t)}
        />
      </div>
      <FormSwitchField
        control={form.control}
        name={ESystemSettingsFormKey.EmailVerification}
        label={t('settings.system.email_verification')}
        description={t('settings.system.email_verification_hint')}
      />
      <FormSwitchField
        control={form.control}
        name={ESystemSettingsFormKey.LandingPage}
        label={t('settings.system.landing_page')}
        description={t('settings.system.landing_page_hint')}
      />
      <FormSwitchField
        control={form.control}
        name={ESystemSettingsFormKey.UserRegistration}
        label={t('settings.system.user_registration')}
        description={t('settings.system.user_registration_hint')}
      />
      <FormInputField
        control={form.control}
        name={ESystemSettingsFormKey.TermsUrl}
        label={t('settings.system.terms_url')}
        placeholder='https://'
        inputMode='url'
      />
    </SettingsCard>
  )
}
