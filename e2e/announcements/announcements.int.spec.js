// @ts-check
// Feature: announcements — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Through the UI: creates ONE company-wide announcement "E2E <ts>" (no files), checks list, dashboard, detail
// (sanitised content) and statistics, edits it, deletes it. afterAll deletes it through the API if a step failed.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const TITLE = `E2E thông báo ${Date.now()}`

let companyId = ''
let announcementId = ''

const headers = () => ({ Authorization: `Bearer ${readSuperAdminToken()}` })

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

test.describe('Thông báo · backend thật', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    const companies = await request.get(`${IAM_URL}iam/companies`, { headers: headers(), params: { size: 50 } })
    companyId = (await companies.json()).data.content.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    expect(companyId, 'no active company to test with').not.toBe('')
    await request.dispose()
  })

  test.afterAll(async ({ playwright }) => {
    if (!announcementId) return
    const request = await playwright.request.newContext()
    const res = await request.delete(`${EMP_URL}org/announcements/${announcementId}`, { headers: headers() })
    expect(res.ok(), 'announcement cleanup failed').toBe(true)
    await request.dispose()
  })

  test('ANN-INT-001 thêm (toàn công ty) → danh sách, bảng tin, chi tiết, thống kê → sửa → xoá', async ({
    page,
    announcementsPage
  }) => {
    test.setTimeout(120_000)
    await announcementsPage.goto(`?companyId=${companyId}`)

    await announcementsPage.addButton.click()
    await announcementsPage.field('Tiêu đề').fill(TITLE)
    await announcementsPage.choose('Loại', 'Sự kiện', announcementsPage.dialog)
    // the backend must strip the script and keep the text
    await announcementsPage.dialog
      .getByRole('textbox', { name: 'Nội dung' })
      .fill('<p id="e2e-body">Nội dung <b>E2E</b></p><script>window.__e2e = 1</script>')
    await announcementsPage.pickDay('Ngày bắt đầu', 1, announcementsPage.dialog)
    await announcementsPage.pickDay('Ngày kết thúc', 28, announcementsPage.dialog)
    await announcementsPage.dialog.getByRole('switch', { name: 'Thông báo nổi bật' }).click()
    const created = nextCall(page, 'POST', /\/org\/announcements$/)
    await announcementsPage.dialog.getByRole('button', { name: 'Tạo thông báo' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    announcementId = (await res.json()).data.id
    await expect(announcementsPage.row(TITLE)).toContainText('Nổi bật')
    await expect(announcementsPage.row(TITLE)).toContainText('Toàn công ty')

    await announcementsPage.views.getByRole('button', { name: 'Bảng tin' }).click()
    await page.getByRole('tab', { name: /^Nổi bật/ }).click()
    await expect(page.getByRole('article', { name: TITLE })).toContainText('Nội dung E2E')

    await page.getByRole('link', { name: `Đọc thêm: ${TITLE}` }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)
    const content = page.frameLocator('iframe[title="Nội dung"]')
    // Spec: HtmlSanitizer keeps safe tags but drops id / class / style, scripts and javascript: links
    await expect(content.locator('p')).toHaveText('Nội dung E2E')
    await expect(content.locator('script')).toHaveCount(0)

    await page.getByRole('link', { name: 'Xem thống kê chi tiết' }).click()
    await expect(page.getByRole('region', { name: 'Tóm tắt thông báo' })).toContainText(TITLE)
    await expect(page.getByRole('region', { name: 'Thống kê thông báo' })).toContainText('Lượt xem0')

    await page.getByRole('link', { name: 'Quay lại' }).click()
    await page.getByRole('button', { name: 'Sửa' }).click()
    await announcementsPage.field('Mô tả ngắn').fill('Đã sửa bởi E2E')
    const updated = nextCall(page, 'PUT', /\/org\/announcements\/\d+$/)
    await announcementsPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(page.getByRole('region', { name: 'Thông tin thông báo' })).toContainText('Đã sửa bởi E2E')

    await announcementsPage.goto(`?companyId=${companyId}`)
    await announcementsPage
      .row(TITLE)
      .getByRole('button', { name: `Xoá ${TITLE}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/org\/announcements\/\d+$/)
    await announcementsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    announcementId = ''
    await expect(announcementsPage.row(TITLE)).toHaveCount(0)
  })
})
