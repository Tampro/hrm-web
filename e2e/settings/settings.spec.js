// @ts-check
// Feature: system settings (super admin). Spec sources: hrm-be SettingsController (/settings/admin/<section> GET + PUT,
// /email/test), SettingsDtos.java validation, messages SETTINGS_001..006.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok } from '../utils/mock-api.js'

const SYSTEM = {
  defaultLanguage: 'vi',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  calendarStartDay: 'MONDAY',
  defaultTimezone: 'Asia/Ho_Chi_Minh',
  emailVerification: false,
  landingPage: true,
  userRegistration: false,
  termsUrl: null
}
const BRAND = {
  logoDarkUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  titleText: 'E2E HRM',
  footerText: null,
  themeColor: '#123abc',
  sidebarVariant: 'INSET',
  sidebarStyle: 'PLAIN',
  layoutDirection: 'LTR',
  themeMode: 'LIGHT'
}
const CURRENCY = {
  format: {
    decimalPlaces: 0,
    symbolPosition: 'AFTER',
    decimalSeparator: 'COMMA',
    thousandsSeparator: 'DOT',
    showDecimals: false,
    addSpace: true
  },
  defaultCurrencyCode: 'VND',
  defaultCurrencySymbol: '₫'
}
const EMAIL = {
  host: 'smtp.e2e.invalid',
  port: 587,
  username: 'e2e-user',
  passwordSet: true,
  encryption: 'TLS',
  fromAddress: 'noreply@e2e.invalid',
  fromName: null
}
const STORAGE = { allowedFileTypes: ['png', 'pdf'], maxUploadSizeKb: 10240 }
const RECAPTCHA = { enabled: false, version: 'V2', siteKey: 'e2e-site-key', secretSet: false }
const COOKIE = {
  enableLogging: false,
  cookieTitle: 'Cookie Consent',
  cookieDescription: null,
  strictlyTitle: null,
  strictlyDescription: null,
  contactDescription: null,
  contactUrl: null
}

/**
 * GET + PUT stub of one section; returns the captured PUT calls.
 * @param {ReturnType<import('../utils/mock-api.js').mockApi>} api
 * @param {string} section path after /settings/admin/
 * @param {unknown} data
 */
const stubSection = async (api, section, data) => {
  await api.route(`/settings/admin/${section}`, { method: 'GET', body: ok(data) })
  return api.route(`/settings/admin/${section}`, { method: 'PUT', body: ok(data) })
}

test('SET-001 @smoke người không phải super admin: không có menu và không gọi API', async ({
  page,
  api,
  baseURL,
  settingsPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const calls = await api.route('/settings/admin/system', { body: ok(SYSTEM) })

  await settingsPage.goto('system')

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cài đặt hệ thống' })).toHaveCount(0)
  expect(calls).toHaveLength(0)
})

test.describe('Cài đặt hệ thống', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  })

  test('SET-002 @smoke /dashboard/settings mở mục Hệ thống; menu có 9 mục', async ({ page, api, settingsPage }) => {
    await stubSection(api, 'system', SYSTEM)

    await settingsPage.goto()

    await expect(page).toHaveURL(/\/dashboard\/settings\/system$/)
    await expect(settingsPage.menu.getByRole('link')).toHaveCount(9)
    await expect(settingsPage.menu.getByRole('link', { name: 'Hệ thống' })).toHaveAttribute('aria-current', 'page')
  })

  test('SET-003 hệ thống: URL điều khoản sai bị chặn; lưu gửi đủ trường, URL rỗng bị bỏ', async ({
    api,
    settingsPage
  }) => {
    const puts = await stubSection(api, 'system', SYSTEM)
    await settingsPage.goto('system')

    await settingsPage.field('Đường dẫn điều khoản sử dụng').fill('ftp://x')
    await expect(settingsPage.page.getByText('Phải là địa chỉ bắt đầu bằng http:// hoặc https://')).toBeVisible()
    await settingsPage.saveButton.click()
    expect(puts).toHaveLength(0)

    await settingsPage.field('Đường dẫn điều khoản sử dụng').fill('')
    await settingsPage.choose('Ngày bắt đầu tuần', 'Chủ Nhật')
    await settingsPage.switchOf('Xác thực email').click()
    await settingsPage.saveButton.click()

    await expect(settingsPage.toast.filter({ hasText: 'Đã lưu cài đặt' })).toBeVisible()
    expect(puts[0].body).toEqual({
      ...SYSTEM,
      calendarStartDay: 'SUNDAY',
      emailVerification: true,
      termsUrl: undefined
    })
  })

  test('SET-004 thương hiệu: màu hex tuỳ chỉnh vẫn được giữ; tên hiển thị bắt buộc', async ({ api, settingsPage }) => {
    const puts = await stubSection(api, 'brand', BRAND)
    await settingsPage.goto('brand')

    await expect(settingsPage.select('Màu chủ đạo')).toContainText('#123abc')
    await settingsPage.field('Tên hiển thị').fill('')
    await settingsPage.saveButton.click()
    await expect(settingsPage.page.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(puts).toHaveLength(0)

    await settingsPage.field('Tên hiển thị').fill('E2E HRM 2')
    await settingsPage.choose('Chế độ sáng/tối', 'Tối')
    await settingsPage.saveButton.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      titleText: 'E2E HRM 2',
      themeColor: '#123abc',
      sidebarVariant: 'INSET',
      sidebarStyle: 'PLAIN',
      layoutDirection: 'LTR',
      themeMode: 'DARK'
    })
  })

  test('SET-005 định dạng tiền: xem trước đổi theo lựa chọn; hai dấu giống nhau bị chặn; decimalPlaces là số', async ({
    api,
    settingsPage
  }) => {
    const puts = await stubSection(api, 'currency', CURRENCY)
    await settingsPage.goto('currency')
    const preview = settingsPage.page.getByTestId('currency-preview')
    await expect(preview).toHaveText('1.234.568 ₫')

    await settingsPage.choose('Số chữ số thập phân', '2')
    await settingsPage.switchOf('Hiển thị phần thập phân').click()
    await settingsPage.choose('Vị trí ký hiệu', 'Trước số tiền')
    await expect(preview).toHaveText('₫ 1.234.567,89')

    await settingsPage.choose('Dấu phân cách hàng nghìn', 'Dấu phẩy (,)')
    await expect(settingsPage.page.getByText('Dấu phân cách hàng nghìn phải khác dấu thập phân')).toBeVisible()
    await settingsPage.saveButton.click()
    expect(puts).toHaveLength(0)

    await settingsPage.choose('Dấu phân cách hàng nghìn', 'Dấu chấm (.)')
    await settingsPage.saveButton.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      decimalPlaces: 2,
      symbolPosition: 'BEFORE',
      decimalSeparator: 'COMMA',
      thousandsSeparator: 'DOT',
      showDecimals: true,
      addSpace: true
    })
  })

  test('SET-006 email: mật khẩu để trống được giữ (không gửi), cổng > 65535 bị chặn', async ({ api, settingsPage }) => {
    const puts = await stubSection(api, 'email', EMAIL)
    await settingsPage.goto('email')

    await expect(settingsPage.page.getByText('Đã lưu mật khẩu. Để trống để giữ nguyên.')).toBeVisible()
    await settingsPage.field('Cổng').fill('70000')
    await expect(settingsPage.page.getByText('Giá trị tối đa là 65535')).toBeVisible()
    await settingsPage.saveButton.click()
    expect(puts).toHaveLength(0)

    await settingsPage.field('Cổng').fill('465')
    await settingsPage.choose('Mã hoá', 'SSL')
    await settingsPage.saveButton.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      host: 'smtp.e2e.invalid',
      port: 465,
      username: 'e2e-user',
      encryption: 'SSL',
      fromAddress: 'noreply@e2e.invalid'
    })
  })

  test('SET-007 email: "Xoá mật khẩu đã lưu" gửi password rỗng; gửi thử gửi đúng địa chỉ', async ({
    api,
    settingsPage
  }) => {
    const puts = await stubSection(api, 'email', EMAIL)
    const tests = await api.route('/settings/admin/email/test', { method: 'POST', body: ok(null) })
    await settingsPage.goto('email')

    await settingsPage.page.getByLabel('Xoá mật khẩu đã lưu').check()
    await expect(settingsPage.field('Mật khẩu SMTP')).toBeDisabled()
    await settingsPage.saveButton.click()
    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body.password).toBe('')

    await settingsPage.page.getByRole('button', { name: 'Gửi email thử' }).click()
    await settingsPage.dialog.getByRole('textbox', { name: 'Gửi tới' }).fill('me@e2e.invalid')
    await settingsPage.dialog.getByRole('button', { name: 'Gửi email thử' }).click()

    await expect(settingsPage.toast.filter({ hasText: 'Đã gửi email thử' })).toBeVisible()
    expect(tests[0].body).toEqual({ to: 'me@e2e.invalid' })
  })

  test('SET-008 email gửi thử thất bại: hiện message SETTINGS_004, hộp thoại vẫn mở', async ({ api, settingsPage }) => {
    await stubSection(api, 'email', EMAIL)
    await api.route('/settings/admin/email/test', {
      method: 'POST',
      status: 400,
      body: fail('SETTINGS_004', 'Không gửi được email thử: e2e-sentinel.')
    })
    await settingsPage.goto('email')

    await settingsPage.page.getByRole('button', { name: 'Gửi email thử' }).click()
    await settingsPage.dialog.getByRole('textbox', { name: 'Gửi tới' }).fill('me@e2e.invalid')
    await settingsPage.dialog.getByRole('button', { name: 'Gửi email thử' }).click()

    await expect(settingsPage.toast).toContainText('Không gửi được email thử: e2e-sentinel.')
    await expect(settingsPage.dialog).toBeVisible()
  })

  test('SET-009 thanh toán chuyển khoản: ô trống bị bỏ khỏi payload', async ({ api, settingsPage }) => {
    const puts = await stubSection(api, 'payment/bank-transfer', {
      enabled: true,
      bankName: null,
      accountNumber: null,
      accountName: null,
      details: null
    })
    await settingsPage.goto('payment')

    await settingsPage.field('Ngân hàng').fill('E2E Bank')
    await settingsPage.saveButton.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ enabled: true, bankName: 'E2E Bank' })
  })

  test('SET-010 lưu trữ: bỏ chọn hết bị chặn; lưu gửi danh sách và số KB', async ({ page, api, settingsPage }) => {
    const puts = await stubSection(api, 'storage', STORAGE)
    await settingsPage.goto('storage')

    await page.getByRole('checkbox', { name: '.png' }).uncheck()
    await page.getByRole('checkbox', { name: '.pdf' }).uncheck()
    await settingsPage.saveButton.click()
    await expect(page.getByText('Chọn ít nhất một mục')).toBeVisible()
    expect(puts).toHaveLength(0)

    await page.getByRole('checkbox', { name: '.csv' }).check()
    await settingsPage.field('Dung lượng tối đa (KB)').fill('2048')
    await settingsPage.saveButton.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ allowedFileTypes: ['csv'], maxUploadSizeKb: 2048 })
  })

  test('SET-011 reCAPTCHA: công tắc Bật bị khoá kèm cảnh báo; secret để trống không gửi', async ({
    api,
    settingsPage
  }) => {
    const puts = await stubSection(api, 'recaptcha', RECAPTCHA)
    await settingsPage.goto('recaptcha')

    await expect(settingsPage.page.getByRole('note')).toContainText('Chưa thể bật reCAPTCHA')
    await expect(settingsPage.switchOf('Bật reCAPTCHA')).toBeDisabled()
    await settingsPage.choose('Phiên bản', 'reCAPTCHA v3')
    await settingsPage.saveButton.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ enabled: false, version: 'V3', siteKey: 'e2e-site-key' })
  })

  test('SET-012 SEO và cookie: ô trống bị bỏ; URL liên hệ sai bị chặn', async ({ api, settingsPage }) => {
    const seoPuts = await stubSection(api, 'seo', { metaKeywords: null, metaDescription: null, metaImageUrl: null })
    const cookiePuts = await stubSection(api, 'cookie', COOKIE)

    await settingsPage.goto('seo')
    await settingsPage.field('Từ khoá').fill('hrm, e2e')
    await settingsPage.saveButton.click()
    await expect.poll(() => seoPuts.length).toBe(1)
    expect(seoPuts[0].body).toEqual({ metaKeywords: 'hrm, e2e' })

    await settingsPage.menu.getByRole('link', { name: 'Cookie' }).click()
    await settingsPage.field('Đường dẫn liên hệ').fill('not-a-url')
    await settingsPage.saveButton.click()
    await expect(settingsPage.page.getByText('Phải là địa chỉ bắt đầu bằng http:// hoặc https://')).toBeVisible()
    expect(cookiePuts).toHaveLength(0)

    await settingsPage.field('Đường dẫn liên hệ').fill('https://e2e.invalid/contact')
    await settingsPage.saveButton.click()
    await expect.poll(() => cookiePuts.length).toBe(1)
    expect(cookiePuts[0].body).toEqual({
      enableLogging: false,
      cookieTitle: 'Cookie Consent',
      contactUrl: 'https://e2e.invalid/contact'
    })
  })

  test('SET-013 lỗi lưu từ backend (SETTINGS_001 múi giờ) hiện message', async ({ api, settingsPage }) => {
    await api.route('/settings/admin/system', { method: 'GET', body: ok(SYSTEM) })
    await api.route('/settings/admin/system', {
      method: 'PUT',
      status: 400,
      body: fail('SETTINGS_001', 'Múi giờ không hợp lệ: e2e-sentinel.')
    })
    await settingsPage.goto('system')

    await settingsPage.saveButton.click()

    await expect(settingsPage.toast).toContainText('Múi giờ không hợp lệ: e2e-sentinel.')
  })
})
