// @ts-check
// Feature: email templates — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// These texts are used for real emails: the one subject changed here is RESTORED to the exact text read at the
// start (afterAll, even on failure). From Name is never changed.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const API_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const LANG = 'en'

/** @type {{ id: string, subject: string, content: string } | null} English text read before the test changes it */
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

test.describe('Mẫu email · backend thật', () => {
  test.afterAll(async ({ playwright }) => {
    if (!original) return
    const request = await playwright.request.newContext({ baseURL: API_URL })
    const res = await request.put(`settings/admin/email-templates/${original.id}/content/${LANG}`, {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` },
      data: { subject: original.subject, content: original.content }
    })
    expect(res.ok(), 'email template restore failed').toBe(true)
    await request.dispose()
  })

  test('ET-INT-001 danh sách thật khớp API; mở mẫu đầu tiên', async ({ page, emailTemplatesPage }) => {
    const listed = nextCall(page, 'GET', /\/email-templates$/)
    await emailTemplatesPage.goto()
    const data = (await (await listed).json()).data
    await expect(page.getByText(new RegExp(`^Hiển thị ${data.content.length} / ${data.totalElements}$`))).toBeVisible()

    const detail = nextCall(page, 'GET', /\/email-templates\/\d+$/)
    await page.getByRole('row').nth(1).click()
    const d = (await (await detail).json()).data
    await expect(emailTemplatesPage.fromName).toHaveValue(d.template.fromName)
    await expect(emailTemplatesPage.variables.getByRole('button')).toHaveCount(d.variables.length)
  })

  test('ET-INT-002 sửa tiêu đề tiếng Anh, tải lại thấy giá trị mới, xem trước thay biến (khôi phục sau test)', async ({
    page,
    emailTemplatesPage
  }) => {
    const listed = nextCall(page, 'GET', /\/email-templates$/)
    await emailTemplatesPage.goto()
    const first = (await (await listed).json()).data.content[0]

    const loaded = nextCall(page, 'GET', /\/email-templates\/\d+$/)
    await emailTemplatesPage.goto(`${first.id}?tab=${LANG}`)
    const en = (await (await loaded).json()).data.contents.find((/** @type {any} */ c) => c.lang === LANG)
    test.skip(!en, 'no English text to edit on this backend')
    original = { id: first.id, subject: en.subject, content: en.content }
    const subject = `E2E ${Date.now()} {app_name}`

    await emailTemplatesPage.subject.fill(subject)
    const saved = nextCall(page, 'PUT', /\/content\/en$/)
    await emailTemplatesPage.saveButtonOf(emailTemplatesPage.contentForm).click()
    expect((await saved).ok()).toBe(true)

    await page.reload()
    await expect(emailTemplatesPage.subject).toHaveValue(subject)

    await emailTemplatesPage.previewButton.click()
    // Spec: preview fills app_name with the brand title, other variables with [name]
    await expect(emailTemplatesPage.dialog).toContainText(/E2E \d+ \S/)
    await expect(emailTemplatesPage.dialog).not.toContainText('{app_name}')
  })
})
