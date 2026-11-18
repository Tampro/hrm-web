import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { Field, FieldDescription, FieldError, FieldLegend, FieldSet } from '~/components/ui/field'
import { getStorageSettingsSchema, type TStorageSettingsSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { EStorageSettingsFormKey } from '~/shared/enums/form.enum'
import { ESettingsSection } from '~/shared/enums/settings.enum'
import type { IStorageSettings } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

// Spec: StorageSettings.SUPPORTED (hrm-be) — the types media-service can verify by content; others give SETTINGS_005
const SUPPORTED_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'pptx', 'txt', 'csv']

const DEFAULT_VALUES: TStorageSettingsSchema = { allowedFileTypes: SUPPORTED_TYPES, maxUploadSizeKb: '10240' }

// Spec: GET / PUT /settings/admin/storage — media-service applies the change within a minute
export default function StorageSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<IStorageSettings, IStorageSettings>(
    ESettingsSection.Storage
  )
  const form = useForm<TStorageSettingsSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getStorageSettingsSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (data)
      form.reset({
        allowedFileTypes: data.allowedFileTypes ?? [],
        maxUploadSizeKb: data.maxUploadSizeKb ? String(data.maxUploadSizeKb) : DEFAULT_VALUES.maxUploadSizeKb
      })
  }, [data, form])

  return (
    <SettingsCard
      title={t('settings.section.storage')}
      description={t('settings.storage.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={form.handleSubmit((v) =>
        save({ allowedFileTypes: v.allowedFileTypes, maxUploadSizeKb: Number(v.maxUploadSizeKb) })
      )}
    >
      <Controller
        name={EStorageSettingsFormKey.AllowedFileTypes}
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant='label'>{t('settings.storage.allowed_types')}</FieldLegend>
            <FieldDescription>{t('settings.storage.allowed_types_hint')}</FieldDescription>
            <div className='flex flex-wrap gap-2'>
              {SUPPORTED_TYPES.map((type) => {
                const checked = field.value.includes(type)
                return (
                  <label
                    key={type}
                    className='has-checked:border-primary has-checked:bg-primary/5 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm'
                  >
                    <input
                      type='checkbox'
                      className='accent-primary size-4'
                      checked={checked}
                      onChange={() =>
                        field.onChange(checked ? field.value.filter((v) => v !== type) : [...field.value, type])
                      }
                    />
                    .{type}
                  </label>
                )
              })}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        )}
      />
      <Field>
        <FormInputField
          control={form.control}
          name={EStorageSettingsFormKey.MaxUploadSizeKb}
          label={t('settings.storage.max_upload_size')}
          description={t('settings.storage.max_upload_size_hint')}
          inputMode='numeric'
          required
        />
      </Field>
    </SettingsCard>
  )
}
