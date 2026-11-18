import type {
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

// Spec: hrm-be SettingsDtos.java. Every PUT replaces the section.

// Spec: SystemSettings — dateFormat / timeFormat use Java patterns (dd/MM/yyyy, HH:mm …)
export interface ISystemSettings {
  defaultLanguage?: string
  dateFormat?: string
  timeFormat?: string
  calendarStartDay?: EWeekDay
  defaultTimezone?: string
  emailVerification?: boolean
  landingPage?: boolean
  userRegistration?: boolean
  termsUrl?: string | null
}

// Spec: BrandSettings — logos are URLs of files in the media library
export interface IBrandSettings {
  logoDarkUrl?: string | null
  logoLightUrl?: string | null
  faviconUrl?: string | null
  titleText?: string
  footerText?: string | null
  themeColor?: string
  sidebarVariant?: ESidebarVariant
  sidebarStyle?: ESidebarStyle
  layoutDirection?: ELayoutDirection
  themeMode?: EThemeMode
}

// Spec: CurrencyFormatSettings
export interface ICurrencyFormatSettings {
  decimalPlaces?: number
  symbolPosition?: ESymbolPosition
  decimalSeparator?: ENumberSeparator
  thousandsSeparator?: ENumberSeparator
  showDecimals?: boolean
  addSpace?: boolean
}

// Spec: CurrencySettingsView — the default currency itself is chosen on the Currency page
export interface ICurrencySettingsView {
  format?: ICurrencyFormatSettings
  defaultCurrencyCode?: string | null
  defaultCurrencySymbol?: string | null
}

// Spec: EmailSettingsView — the password is never returned (passwordSet)
export interface IEmailSettingsView {
  host?: string | null
  port?: number | null
  username?: string | null
  passwordSet?: boolean
  encryption?: EMailEncryption
  fromAddress?: string | null
  fromName?: string | null
}

// Spec: EmailSettingsForm — password: omitted = keep, '' = remove
export interface IEmailSettingsPayload {
  host: string
  port: number
  username?: string
  password?: string
  encryption: EMailEncryption
  fromAddress: string
  fromName?: string
}

// Spec: BankTransferSettings — empty account fields fall back to the SAAS_BANK_* environment values
export interface IBankTransferSettings {
  enabled?: boolean
  bankName?: string | null
  accountNumber?: string | null
  accountName?: string | null
  details?: string | null
}

// Spec: StorageSettings
export interface IStorageSettings {
  allowedFileTypes?: string[]
  maxUploadSizeKb?: number
}

// Spec: SeoSettings
export interface ISeoSettings {
  metaKeywords?: string | null
  metaDescription?: string | null
  metaImageUrl?: string | null
}

// Spec: RecaptchaSettingsView — the secret is never returned (secretSet)
export interface IRecaptchaSettingsView {
  enabled?: boolean
  version?: ERecaptchaVersion
  siteKey?: string | null
  secretSet?: boolean
}

// Spec: RecaptchaSettingsForm — secret write-only (omitted = keep); enabling needs a secret (SETTINGS_006)
export interface IRecaptchaSettingsPayload {
  enabled: boolean
  version: ERecaptchaVersion
  siteKey?: string
  secret?: string
}

// Spec: CookieSettings
export interface ICookieSettings {
  enableLogging?: boolean
  cookieTitle?: string | null
  cookieDescription?: string | null
  strictlyTitle?: string | null
  strictlyDescription?: string | null
  contactDescription?: string | null
  contactUrl?: string | null
}
