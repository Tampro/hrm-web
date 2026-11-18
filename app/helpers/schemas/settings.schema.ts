import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, numberText, required, requiredEmail, requiredText } from '~/helpers/schema.helper'
import {
  EBankTransferFormKey,
  EBrandSettingsFormKey,
  ECookieSettingsFormKey,
  ECurrencyFormatFormKey,
  EEmailSettingsFormKey,
  ERecaptchaSettingsFormKey,
  ESeoSettingsFormKey,
  EStorageSettingsFormKey,
  ESystemSettingsFormKey
} from '~/shared/enums/form.enum'
import {
  ELayoutDirection,
  EMailEncryption,
  ENumberSeparator,
  ERecaptchaVersion,
  ESidebarStyle,
  ESidebarVariant,
  ESymbolPosition,
  EThemeMode,
  EWeekDay
} from '~/shared/enums/settings.enum'

// Spec: hrm-be SettingsDtos.java (bean validation) + the patterns Swagger shows.

const optionalText = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

/** Empty or an http(s) URL (Spec: termsUrl / contactUrl pattern ^$|https?://.+) */
const optionalUrl = (max: number, t?: TFunction) =>
  optionalText(max, t).refine((v) => v === '' || /^https?:\/\/.+/.test(v), { message: t?.('validation.url') })

// Spec: SystemSettings — language vi|en|ko, Java date/time patterns, IANA timezone (SETTINGS_001 when unknown)
export const getSystemSettingsSchema = (t?: TFunction) =>
  z.object({
    [ESystemSettingsFormKey.DefaultLanguage]: z.enum(['vi', 'en', 'ko']),
    [ESystemSettingsFormKey.DateFormat]: z.enum(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd.MM.yyyy']),
    [ESystemSettingsFormKey.TimeFormat]: z.enum(['HH:mm', 'hh:mm a', 'HH:mm:ss']),
    [ESystemSettingsFormKey.CalendarStartDay]: z.enum(EWeekDay),
    [ESystemSettingsFormKey.DefaultTimezone]: requiredText(60, t),
    [ESystemSettingsFormKey.EmailVerification]: z.boolean(),
    [ESystemSettingsFormKey.LandingPage]: z.boolean(),
    [ESystemSettingsFormKey.UserRegistration]: z.boolean(),
    [ESystemSettingsFormKey.TermsUrl]: optionalUrl(500, t)
  })

export type TSystemSettingsSchema = z.infer<ReturnType<typeof getSystemSettingsSchema>>

// Spec: BrandSettings — themeColor is a preset name or #RRGGBB
export const getBrandSettingsSchema = (t?: TFunction) =>
  z.object({
    [EBrandSettingsFormKey.LogoDarkUrl]: optionalText(1000, t),
    [EBrandSettingsFormKey.LogoLightUrl]: optionalText(1000, t),
    [EBrandSettingsFormKey.FaviconUrl]: optionalText(1000, t),
    [EBrandSettingsFormKey.TitleText]: requiredText(100, t),
    [EBrandSettingsFormKey.FooterText]: optionalText(255, t),
    [EBrandSettingsFormKey.ThemeColor]: z
      .string()
      .regex(/^(blue|green|purple|orange|red|teal|#[0-9a-fA-F]{6})$/, t?.('validation.theme_color')),
    [EBrandSettingsFormKey.SidebarVariant]: z.enum(ESidebarVariant),
    [EBrandSettingsFormKey.SidebarStyle]: z.enum(ESidebarStyle),
    [EBrandSettingsFormKey.LayoutDirection]: z.enum(ELayoutDirection),
    [EBrandSettingsFormKey.ThemeMode]: z.enum(EThemeMode)
  })

export type TBrandSettingsSchema = z.infer<ReturnType<typeof getBrandSettingsSchema>>

// Spec: CurrencyFormatSettings — decimalPlaces 0–4; the two separators should differ (a number would be unreadable)
export const getCurrencyFormatSchema = (t?: TFunction) =>
  z
    .object({
      [ECurrencyFormatFormKey.DecimalPlaces]: z.number().int().min(0).max(4),
      [ECurrencyFormatFormKey.SymbolPosition]: z.enum(ESymbolPosition),
      [ECurrencyFormatFormKey.DecimalSeparator]: z.enum(ENumberSeparator),
      [ECurrencyFormatFormKey.ThousandsSeparator]: z.enum(ENumberSeparator),
      [ECurrencyFormatFormKey.ShowDecimals]: z.boolean(),
      [ECurrencyFormatFormKey.AddSpace]: z.boolean()
    })
    // TODO(assumption): the BE does not reject equal separators; the UI does, since "1.000.00" is ambiguous
    .refine((v) => v.decimalSeparator === ENumberSeparator.None || v.decimalSeparator !== v.thousandsSeparator, {
      path: [ECurrencyFormatFormKey.ThousandsSeparator],
      message: t?.('validation.separators_differ')
    })

export type TCurrencyFormatSchema = z.infer<ReturnType<typeof getCurrencyFormatSchema>>

// Spec: EmailSettingsForm — host @NotBlank ≤255, port 1–65535, fromAddress @NotBlank @Email; password write-only
export const getEmailSettingsSchema = (t?: TFunction) =>
  z.object({
    [EEmailSettingsFormKey.Host]: requiredText(255, t),
    [EEmailSettingsFormKey.Port]: numberText(t, { required: true, min: 1, integer: true }).refine(
      (v) => v === '' || Number(v) <= 65535,
      { message: t?.('validation.max_value', { max: 65535 }) }
    ),
    [EEmailSettingsFormKey.Username]: optionalText(255, t),
    [EEmailSettingsFormKey.Password]: optionalText(255, t),
    [EEmailSettingsFormKey.Encryption]: z.enum(EMailEncryption),
    [EEmailSettingsFormKey.FromAddress]: requiredEmail(255, t),
    [EEmailSettingsFormKey.FromName]: optionalText(100, t)
  })

export type TEmailSettingsSchema = z.infer<ReturnType<typeof getEmailSettingsSchema>>

// Spec: TestEmailForm — to @NotBlank @Email
export const getTestEmailSchema = (t?: TFunction) => z.object({ [EEmailSettingsFormKey.TestTo]: requiredEmail(255, t) })

export type TTestEmailSchema = z.infer<ReturnType<typeof getTestEmailSchema>>

// Spec: BankTransferSettings
export const getBankTransferSchema = (t?: TFunction) =>
  z.object({
    [EBankTransferFormKey.Enabled]: z.boolean(),
    [EBankTransferFormKey.BankName]: optionalText(100, t),
    [EBankTransferFormKey.AccountNumber]: optionalText(50, t),
    [EBankTransferFormKey.AccountName]: optionalText(100, t),
    [EBankTransferFormKey.Details]: optionalText(1000, t)
  })

export type TBankTransferSchema = z.infer<ReturnType<typeof getBankTransferSchema>>

// Spec: StorageSettings — allowedFileTypes @Size(min = 1) among the types media-service checks (SETTINGS_005),
// maxUploadSizeKb 1–1048576
export const getStorageSettingsSchema = (t?: TFunction) =>
  z.object({
    [EStorageSettingsFormKey.AllowedFileTypes]: z.array(z.string()).min(1, t?.('validation.pick_one')),
    [EStorageSettingsFormKey.MaxUploadSizeKb]: numberText(t, { required: true, min: 1, integer: true }).refine(
      (v) => v === '' || Number(v) <= 1048576,
      { message: t?.('validation.max_value', { max: 1048576 }) }
    )
  })

export type TStorageSettingsSchema = z.infer<ReturnType<typeof getStorageSettingsSchema>>

// Spec: SeoSettings
export const getSeoSettingsSchema = (t?: TFunction) =>
  z.object({
    [ESeoSettingsFormKey.MetaKeywords]: optionalText(500, t),
    [ESeoSettingsFormKey.MetaDescription]: optionalText(500, t),
    [ESeoSettingsFormKey.MetaImageUrl]: optionalText(1000, t)
  })

export type TSeoSettingsSchema = z.infer<ReturnType<typeof getSeoSettingsSchema>>

// Spec: RecaptchaSettingsForm — version required, siteKey / secret ≤ 200, secret write-only
export const getRecaptchaSettingsSchema = (t?: TFunction) =>
  z.object({
    [ERecaptchaSettingsFormKey.Enabled]: z.boolean(),
    [ERecaptchaSettingsFormKey.Version]: z.enum(ERecaptchaVersion, { message: required(t) }),
    [ERecaptchaSettingsFormKey.SiteKey]: optionalText(200, t),
    [ERecaptchaSettingsFormKey.Secret]: optionalText(200, t)
  })

export type TRecaptchaSettingsSchema = z.infer<ReturnType<typeof getRecaptchaSettingsSchema>>

// Spec: CookieSettings
export const getCookieSettingsSchema = (t?: TFunction) =>
  z.object({
    [ECookieSettingsFormKey.EnableLogging]: z.boolean(),
    [ECookieSettingsFormKey.CookieTitle]: optionalText(200, t),
    [ECookieSettingsFormKey.CookieDescription]: optionalText(2000, t),
    [ECookieSettingsFormKey.StrictlyTitle]: optionalText(200, t),
    [ECookieSettingsFormKey.StrictlyDescription]: optionalText(2000, t),
    [ECookieSettingsFormKey.ContactDescription]: optionalText(2000, t),
    [ECookieSettingsFormKey.ContactUrl]: optionalUrl(500, t)
  })

export type TCookieSettingsSchema = z.infer<ReturnType<typeof getCookieSettingsSchema>>
