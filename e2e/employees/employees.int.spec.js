// @ts-check
// Feature: employees — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Creates ONE employee "E2E <timestamp>" (email @e2e.invalid, no files) in the first active company, edits it,
// downloads a letter, then deletes it through the UI. Delete is soft and locks the IAM account; afterAll deletes it
// through the API if a step failed before. The welcome email to .invalid is sent async and simply fails.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const STAMP = Date.now()
const NAME = `E2E ${STAMP}`

let companyId = ''
/** id of the employee created here, until it is deleted */
let createdId = ''

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

test.describe('Nhân viên · backend thật', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    const res = await request.get(`${IAM_URL}iam/companies`, {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` },
      params: { size: 50 }
    })
    companyId = (await res.json()).data.content.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    await request.dispose()
    expect(companyId, 'no active company to test with').not.toBe('')
  })

  test.afterAll(async ({ playwright }) => {
    if (!createdId) return
    const request = await playwright.request.newContext()
    const res = await request.delete(`${EMP_URL}employees/${createdId}`, {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` }
    })
    expect(res.ok(), 'employee cleanup failed').toBe(true)
    await request.dispose()
  })

  test('EMP-INT-001 danh sách thật của công ty: số tab khớp status-counts', async ({ page, employeesPage }) => {
    const counts = nextCall(page, 'GET', /\/employees\/status-counts$/)
    await employeesPage.goto(`?companyId=${companyId}`)
    const c = (await (await counts).json()).data

    await expect(employeesPage.tab('Tất cả')).toContainText(String(c.all))
  })

  test('EMP-INT-002 thêm nhân viên qua wizard → hồ sơ hiện đúng; sửa điện thoại; đổi trạng thái', async ({
    page,
    employeesPage
  }) => {
    await employeesPage.goto(`/create?companyId=${companyId}`)
    await employeesPage.field('Họ và tên').fill(NAME)
    await employeesPage.nextButton.click()
    await employeesPage.pickDay('Ngày vào làm', 1)
    await employeesPage.nextButton.click()
    await employeesPage.nextButton.click()
    await employeesPage.field('Email').fill(`e2e.${STAMP}@e2e.invalid`)
    const created = nextCall(page, 'POST', /\/employees$/)
    await page.getByRole('button', { name: 'Tạo nhân viên' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    createdId = (await res.json()).data.id

    await expect(page).toHaveURL(new RegExp(`/dashboard/employees/${createdId}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME)
    // Spec: the employee ID (EMP000001…) is issued by the system; it starts the subtitle
    await expect(page.getByText(/^EMP\d+ · /)).toBeVisible()

    await page.getByRole('link', { name: 'Chỉnh sửa hồ sơ' }).click()
    await expect(employeesPage.field('Họ và tên')).toHaveValue(NAME)
    await employeesPage.field('Điện thoại').fill('0900000001')
    await employeesPage.nextButton.click()
    await employeesPage.nextButton.click()
    const updated = nextCall(page, 'PUT', /\/employees\/\d+$/)
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(page.getByRole('region', { name: 'Thông tin cá nhân' })).toContainText('0900000001')

    await employeesPage.openAction('Đổi trạng thái')
    await employeesPage.dialog.getByLabel('Thử việc').check()
    await employeesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.locator('h1 + [data-slot=badge]')).toHaveText('Thử việc')
  })

  test('EMP-INT-003 tải thư nhận việc PDF thật', async ({ page, employeesPage }) => {
    test.skip(!createdId, 'needs the employee of EMP-INT-002')
    await employeesPage.goto(`/${createdId}?tab=LETTERS`)

    const letter = nextCall(page, 'GET', /\/letters\/JOINING_LETTER$/)
    const download = page.waitForEvent('download')
    await page.getByRole('listitem').filter({ hasText: 'Thư mời nhận việc' }).getByRole('button').click()

    expect((await letter).headers()['content-type']).toContain('application/pdf')
    expect((await download).suggestedFilename()).toMatch(/-joining_letter-vi\.pdf$/)
  })

  test('EMP-INT-004 xoá nhân viên qua UI → về danh sách, không còn tìm thấy', async ({ page, employeesPage }) => {
    test.skip(!createdId, 'needs the employee of EMP-INT-002')
    await employeesPage.goto(`/${createdId}`)

    await employeesPage.openAction('Xoá nhân viên')
    const deleted = nextCall(page, 'DELETE', /\/employees\/\d+$/)
    await employeesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    createdId = ''

    await expect(page).toHaveURL(/\/dashboard\/employees\?.*companyId=\d+/)
    const list = nextCall(page, 'GET', /\/employees$/)
    await employeesPage.keyword.fill(NAME)
    await employeesPage.searchButton.click()
    expect((await (await list).json()).data.totalElements).toBe(0)
  })
})
