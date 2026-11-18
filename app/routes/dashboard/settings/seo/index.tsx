import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { getSeoSettingsSchema, type TSeoSettingsSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { ESeoSettingsFormKey } from '~/shared/enums/form.enum'
import { ESettingsSection } from '~/shared/enums/settings.enum'
import type { ISeoSettings } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

// Spec: GET / PUT /settings/admin/seo (SeoSettings)
export default function SeoSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<ISeoSettings, ISeoSettings>(ESettingsSection.Seo)
  const form = useForm<TSeoSettingsSchema>({
    defaultValues: { metaKeywords: '', metaDescription: '', metaImageUrl: '' },
    resolver: zodResolver(getSeoSettingsSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (data)
      form.reset({
        metaKeywords: data.metaKeywords ?? '',
        metaDescription: data.metaDescription ?? '',
        metaImageUrl: data.metaImageUrl ?? ''
      })
  }, [data, form])

  return (
    <SettingsCard
      title={t('settings.section.seo')}
      description={t('settings.seo.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={form.handleSubmit((v) =>
        save({
          metaKeywords: v.metaKeywords || undefined,
          metaDescription: v.metaDescription || undefined,
          metaImageUrl: v.metaImageUrl || undefined
        })
      )}
    >
      <FormInputField
        control={form.control}
        name={ESeoSettingsFormKey.MetaKeywords}
        label={t('settings.seo.meta_keywords')}
        description={t('settings.seo.meta_keywords_hint')}
      />
      <FormTextareaField
        control={form.control}
        name={ESeoSettingsFormKey.MetaDescription}
        label={t('settings.seo.meta_description')}
      />
      <FormInputField
        control={form.control}
        name={ESeoSettingsFormKey.MetaImageUrl}
        label={t('settings.seo.meta_image_url')}
        placeholder='https://'
        inputMode='url'
      />
    </SettingsCard>
  )
}
