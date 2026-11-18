// @ts-check
// Feature: system settings — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Only SEO is written, and it is RESTORED to the exact values read at the start (afterAll, even on failure).
// Never written here: email (real SMTP secrets), reCAPTCHA (enabling it locks everyone out of login); no test email is sent.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const API_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

/** @type {any} SEO settings read before the test changes them */
let original = null

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} method
 * @param {RegExp} path
 */
const nextCall = (page, method, path) =>
  page.waitForResponse((r) => {
    const { pathname } = new URL(r.url())
    return r.request().method() === method && pathname.startsWith('/api/') && path.test(pathname)
  })

test.describe('Cài đặt hệ thống · backend thật', () => {
  test.afterAll(async ({ playwright }) => {
    if (!original) return
    const request = await playwright.request.newContext({ baseURL: API_URL })
    const res = await request.put('settings/admin/seo', {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` },
      data: original
    })
    expect(res.ok(), 'SEO restore failed').toBe(true)
    await request.dispose()
  })

  test('SET-INT-001 mục Hệ thống hiển thị đúng giá trị từ API', async ({ page, settingsPage }) => {
    const loaded = nextCall(page, 'GET', /\/settings\/admin\/system$/)
    await settingsPage.goto('system')
    const data = (await (await loaded).json()).data

    await expect(settingsPage.select('Múi giờ mặc định')).toContainText(data.defaultTimezone)
    await expect(settingsPage.field('Đường dẫn điều khoản sử dụng')).toHaveValue(data.termsUrl ?? '')
  })

  test('SET-INT-002 lưu SEO thật rồi tải lại thấy giá trị mới (khôi phục sau test)', async ({ page, settingsPage }) => {
    const loaded = nextCall(page, 'GET', /\/settings\/admin\/seo$/)
    await settingsPage.goto('seo')
    original = (await (await loaded).json()).data
    const keywords = `e2e-${Date.now()}`

    await settingsPage.field('Từ khoá').fill(keywords)
    const saved = nextCall(page, 'PUT', /\/settings\/admin\/seo$/)
    await settingsPage.saveButton.click()
    expect((await saved).ok()).toBe(true)
    await expect(settingsPage.toast.filter({ hasText: 'Đã lưu cài đặt' })).toBeVisible()

    const reloaded = nextCall(page, 'GET', /\/settings\/admin\/seo$/)
    await page.reload()
    await reloaded
    await expect(settingsPage.field('Từ khoá')).toHaveValue(keywords)
  })
})
