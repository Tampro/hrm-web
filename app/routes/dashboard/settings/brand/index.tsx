import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { FieldSeparator } from '~/components/ui/field'
import { getBrandSettingsSchema, type TBrandSettingsSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { DATA } from '~/shared/constants/data.constant'
import { EBrandSettingsFormKey } from '~/shared/enums/form.enum'
import {
  ELayoutDirection,
  ESettingsSection,
  ESidebarStyle,
  ESidebarVariant,
  EThemeMode
} from '~/shared/enums/settings.enum'
import type { IBrandSettings } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

const DEFAULT_VALUES: TBrandSettingsSchema = {
  logoDarkUrl: '',
  logoLightUrl: '',
  faviconUrl: '',
  titleText: '',
  footerText: '',
  themeColor: 'blue',
  sidebarVariant: ESidebarVariant.Inset,
  sidebarStyle: ESidebarStyle.Plain,
  layoutDirection: ELayoutDirection.Ltr,
  themeMode: EThemeMode.Light
}

/** Small preview of an image URL; a broken URL shows nothing rather than an error icon */
function UrlPreview({ url, label }: { url: string; label: string }) {
  if (!/^https?:\/\//.test(url)) return null
  return (
    <img
      src={url}
      alt={label}
      className='bg-muted h-12 max-w-40 rounded border object-contain p-1'
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  )
}

// Spec: GET / PUT /settings/admin/brand (BrandSettings). Logos / favicon are URLs of files in the media library.
// Saved only — applying the theme to the app is a separate change.
export default function BrandSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<IBrandSettings, IBrandSettings>(ESettingsSection.Brand)
  const form = useForm<TBrandSettingsSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getBrandSettingsSchema(t)),
    mode: 'all'
  })
  const [logoDark, logoLight, favicon, themeColor] = useWatch({
    control: form.control,
    name: [
      EBrandSettingsFormKey.LogoDarkUrl,
      EBrandSettingsFormKey.LogoLightUrl,
      EBrandSettingsFormKey.FaviconUrl,
      EBrandSettingsFormKey.ThemeColor
    ]
  })
  // Spec: themeColor may also be a custom #RRGGBB (set elsewhere) — keep it selectable instead of showing blank
  const presetColors = DATA.GET_THEME_COLOR_OPTIONS(t)
  const colorOptions =
    themeColor && !presetColors.some((o) => o.value === themeColor)
      ? [...presetColors, { label: themeColor, value: themeColor }]
      : presetColors

  useEffect(() => {
    if (data)
      form.reset({
        ...DEFAULT_VALUES,
        ...data,
        logoDarkUrl: data.logoDarkUrl ?? '',
        logoLightUrl: data.logoLightUrl ?? '',
        faviconUrl: data.faviconUrl ?? '',
        footerText: data.footerText ?? ''
      } as TBrandSettingsSchema)
  }, [data, form])

  const handleSave = form.handleSubmit((values) =>
    save({
      ...values,
      logoDarkUrl: values.logoDarkUrl || undefined,
      logoLightUrl: values.logoLightUrl || undefined,
      faviconUrl: values.faviconUrl || undefined,
      footerText: values.footerText || undefined
    })
  )

  return (
    <SettingsCard
      title={t('settings.section.brand')}
      description={t('settings.brand.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={handleSave}
    >
      <FieldSeparator>{t('settings.brand.logos')}</FieldSeparator>
      {(
        [
          [EBrandSettingsFormKey.LogoDarkUrl, 'settings.brand.logo_dark', logoDark],
          [EBrandSettingsFormKey.LogoLightUrl, 'settings.brand.logo_light', logoLight],
          [EBrandSettingsFormKey.FaviconUrl, 'settings.brand.favicon', favicon]
        ] as const
      ).map(([name, label, url]) => (
        <div key={name} className='flex flex-col gap-2'>
          <FormInputField
            control={form.control}
            name={name}
            label={t(label)}
            description={t('settings.brand.url_hint')}
            placeholder='https://'
            inputMode='url'
          />
          <UrlPreview url={url} label={t(label)} />
        </div>
      ))}
      <FieldSeparator>{t('settings.brand.text')}</FieldSeparator>
      <FormInputField
        control={form.control}
        name={EBrandSettingsFormKey.TitleText}
        label={t('settings.brand.title_text')}
        required
      />
      <FormInputField
        control={form.control}
        name={EBrandSettingsFormKey.FooterText}
        label={t('settings.brand.footer_text')}
      />
      <FieldSeparator>{t('settings.brand.theme')}</FieldSeparator>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormSelectField
          control={form.control}
          name={EBrandSettingsFormKey.ThemeColor}
          label={t('settings.brand.theme_color')}
          options={colorOptions}
        />
        <FormSelectField
          control={form.control}
          name={EBrandSettingsFormKey.ThemeMode}
          label={t('settings.brand.theme_mode')}
          options={DATA.GET_THEME_MODE_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={EBrandSettingsFormKey.SidebarVariant}
          label={t('settings.brand.sidebar_variant')}
          options={DATA.GET_SIDEBAR_VARIANT_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={EBrandSettingsFormKey.SidebarStyle}
          label={t('settings.brand.sidebar_style')}
          options={DATA.GET_SIDEBAR_STYLE_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={EBrandSettingsFormKey.LayoutDirection}
          label={t('settings.brand.layout_direction')}
          options={DATA.GET_LAYOUT_DIRECTION_OPTIONS(t)}
        />
      </div>
      <p className='text-muted-foreground text-sm'>{t('settings.brand.not_applied_yet')}</p>
    </SettingsCard>
  )
}
