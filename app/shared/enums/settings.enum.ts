// Settings sections that have a backend API (route segment = API section, except payment)
export enum ESettingsSection {
  System = 'system',
  Brand = 'brand',
  Currency = 'currency',
  Email = 'email',
  Payment = 'payment',
  Storage = 'storage',
  Seo = 'seo',
  Recaptcha = 'recaptcha',
  Cookie = 'cookie'
}

// Spec: SystemSettings.calendarStartDay
export enum EWeekDay {
  Monday = 'MONDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY',
  Thursday = 'THURSDAY',
  Friday = 'FRIDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY'
}

// Spec: BrandSettings
export enum ESidebarVariant {
  Inset = 'INSET',
  Floating = 'FLOATING',
  Minimal = 'MINIMAL'
}

export enum ESidebarStyle {
  Plain = 'PLAIN',
  Colored = 'COLORED',
  Gradient = 'GRADIENT'
}

export enum ELayoutDirection {
  Ltr = 'LTR',
  Rtl = 'RTL'
}

export enum EThemeMode {
  Light = 'LIGHT',
  Dark = 'DARK',
  System = 'SYSTEM'
}

// Spec: CurrencyFormatSettings
export enum ESymbolPosition {
  Before = 'BEFORE',
  After = 'AFTER'
}

export enum ENumberSeparator {
  Dot = 'DOT',
  Comma = 'COMMA',
  Space = 'SPACE',
  None = 'NONE'
}

// Spec: EmailSettingsForm.encryption
export enum EMailEncryption {
  None = 'NONE',
  Ssl = 'SSL',
  Tls = 'TLS'
}

// Spec: RecaptchaSettingsForm.version
export enum ERecaptchaVersion {
  V2 = 'V2',
  V3 = 'V3'
}
