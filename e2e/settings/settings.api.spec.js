// @ts-check
// Feature: system settings — backend contract tests against the real IAM (project "api", token from the setup project).
// Read-only: only GETs, never PUT and never the email test endpoint. Spec sources: hrm-be SettingsController, SettingsDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

/** section path → keys of its view DTO */
const SECTIONS = {
  system: [
    'calendarStartDay',
    'dateFormat',
    'defaultLanguage',
    'defaultTimezone',
    'emailVerification',
    'landingPage',
    'termsUrl',
    'timeFormat',
    'userRegistration'
  ],
  brand: [
    'faviconUrl',
    'footerText',
    'layoutDirection',
    'logoDarkUrl',
    'logoLightUrl',
    'sidebarStyle',
    'sidebarVariant',
    'themeColor',
    'themeMode',
    'titleText'
  ],
  currency: ['defaultCurrencyCode', 'defaultCurrencySymbol', 'format'],
  email: ['encryption', 'fromAddress', 'fromName', 'host', 'passwordSet', 'port', 'username'],
  'payment/bank-transfer': ['accountName', 'accountNumber', 'bankName', 'details', 'enabled'],
  storage: ['allowedFileTypes', 'maxUploadSizeKb'],
  seo: ['metaDescription', 'metaImageUrl', 'metaKeywords'],
  recaptcha: ['enabled', 'secretSet', 'siteKey', 'version'],
  cookie: [
    'contactDescription',
    'contactUrl',
    'cookieDescription',
    'cookieTitle',
    'enableLogging',
    'strictlyDescription',
    'strictlyTitle'
  ]
}

test.describe('Settings API', () => {
  test('SET-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get('settings/admin/system')).status()).toBe(401)
  })
})

test.describe('Settings API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  test.beforeAll(() => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
  })

  for (const [section, keys] of Object.entries(SECTIONS)) {
    test(`SET-API-010 GET ${section}: đúng các trường của view DTO`, async ({ request }) => {
      const res = await request.get(`settings/admin/${section}`, { headers: auth })

      expect(res.status()).toBe(200)
      expect(Object.keys((await res.json()).data).sort()).toEqual([...keys].sort())
    })
  }

  test('SET-API-011 secret không bao giờ trả về: email chỉ có passwordSet, reCAPTCHA chỉ có secretSet', async ({
    request
  }) => {
    const email = (await (await request.get('settings/admin/email', { headers: auth })).json()).data
    const recaptcha = (await (await request.get('settings/admin/recaptcha', { headers: auth })).json()).data

    expect(email).not.toHaveProperty('password')
    expect(typeof email.passwordSet).toBe('boolean')
    expect(recaptcha).not.toHaveProperty('secretKey')
    expect(typeof recaptcha.secretSet).toBe('boolean')
  })

  test('SET-API-012 currency.format có đủ 6 trường định dạng', async ({ request }) => {
    const data = (await (await request.get('settings/admin/currency', { headers: auth })).json()).data

    expect(Object.keys(data.format).sort()).toEqual(
      ['addSpace', 'decimalPlaces', 'decimalSeparator', 'showDecimals', 'symbolPosition', 'thousandsSeparator'].sort()
    )
  })
})
