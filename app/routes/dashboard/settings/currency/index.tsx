import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { FormSelectField } from '~/components/forms/form-select-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { Field, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { getCurrencyFormatSchema, type TCurrencyFormatSchema } from '~/helpers/schemas/settings.schema'
import { useSettingsSection } from '~/hooks/apis/use-settings-api'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { ECurrencyFormatFormKey } from '~/shared/enums/form.enum'
import { ENumberSeparator, ESettingsSection, ESymbolPosition } from '~/shared/enums/settings.enum'
import type { ICurrencyFormatSettings, ICurrencySettingsView } from '~/shared/models/settings.model'

import { SettingsCard } from '../components/settings-card'

const DEFAULT_VALUES: TCurrencyFormatSchema = {
  decimalPlaces: 0,
  symbolPosition: ESymbolPosition.After,
  decimalSeparator: ENumberSeparator.Comma,
  thousandsSeparator: ENumberSeparator.Dot,
  showDecimals: false,
  addSpace: true
}

const SEPARATOR_CHAR: Record<ENumberSeparator, string> = {
  [ENumberSeparator.Dot]: '.',
  [ENumberSeparator.Comma]: ',',
  [ENumberSeparator.Space]: ' ',
  [ENumberSeparator.None]: ''
}

/** Live example of the format (manual: "Format Options" preview) */
const formatExample = (f: TCurrencyFormatSchema, symbol: string) => {
  const [integer, fraction] = (1234567.891).toFixed(f.decimalPlaces).split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, SEPARATOR_CHAR[f.thousandsSeparator])
  const amount = f.showDecimals && fraction ? `${grouped}${SEPARATOR_CHAR[f.decimalSeparator]}${fraction}` : grouped
  const space = f.addSpace ? ' ' : ''
  return f.symbolPosition === ESymbolPosition.Before ? `${symbol}${space}${amount}` : `${amount}${space}${symbol}`
}

// Spec: GET / PUT /settings/admin/currency — PUT takes CurrencyFormatSettings; GET also returns the default currency,
// which is chosen on the Currency page.
export default function CurrencySettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, save, isSaving } = useSettingsSection<ICurrencySettingsView, ICurrencyFormatSettings>(
    ESettingsSection.Currency
  )
  const form = useForm<TCurrencyFormatSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getCurrencyFormatSchema(t)),
    mode: 'all'
  })
  const values = useWatch({ control: form.control }) as TCurrencyFormatSchema
  const symbol = data?.defaultCurrencySymbol || data?.defaultCurrencyCode || '¤'

  useEffect(() => {
    if (data?.format) form.reset({ ...DEFAULT_VALUES, ...data.format } as TCurrencyFormatSchema)
  }, [data, form])

  return (
    <SettingsCard
      title={t('settings.section.currency')}
      description={t('settings.currency.description')}
      loading={isLoading}
      saving={isSaving}
      onSubmit={form.handleSubmit((v) => save(v))}
    >
      <div className='bg-muted/50 flex flex-col gap-1 rounded-lg border p-4'>
        <span className='text-muted-foreground text-sm'>{t('settings.currency.preview')}</span>
        <span className='text-xl font-semibold' data-testid='currency-preview'>
          {formatExample({ ...DEFAULT_VALUES, ...values }, symbol)}
        </span>
        <span className='text-muted-foreground text-sm'>
          {t('settings.currency.default_currency', { code: data?.defaultCurrencyCode || '-' })}{' '}
          <Link to={ROUTES.CURRENCIES} className='text-primary underline-offset-4 hover:underline'>
            {t('settings.currency.change_default')}
          </Link>
        </span>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Controller
          name={ECurrencyFormatFormKey.DecimalPlaces}
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('settings.currency.decimal_places')}</FieldLabel>
              <Select
                items={DATA.GET_DECIMAL_PLACES_OPTIONS()}
                value={String(field.value)}
                onValueChange={(value) => value !== null && field.onChange(Number(value))}
              >
                <SelectTrigger id={field.name} className='h-[38px] w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA.GET_DECIMAL_PLACES_OPTIONS().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <FormSelectField
          control={form.control}
          name={ECurrencyFormatFormKey.SymbolPosition}
          label={t('settings.currency.symbol_position')}
          options={DATA.GET_SYMBOL_POSITION_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={ECurrencyFormatFormKey.DecimalSeparator}
          label={t('settings.currency.decimal_separator')}
          options={DATA.GET_SEPARATOR_OPTIONS(t)}
        />
        <FormSelectField
          control={form.control}
          name={ECurrencyFormatFormKey.ThousandsSeparator}
          label={t('settings.currency.thousands_separator')}
          options={DATA.GET_SEPARATOR_OPTIONS(t)}
        />
      </div>
      <FormSwitchField
        control={form.control}
        name={ECurrencyFormatFormKey.ShowDecimals}
        label={t('settings.currency.show_decimals')}
      />
      <FormSwitchField
        control={form.control}
        name={ECurrencyFormatFormKey.AddSpace}
        label={t('settings.currency.add_space')}
        description={t('settings.currency.add_space_hint')}
      />
    </SettingsCard>
  )
}
