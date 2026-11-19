// @ts-check
// Feature: branches — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Creates ONE branch "E2E <timestamp>" in the first active company, edits it, deactivates it, views its counts and
// deletes it through the UI (a new branch has no departments or employees, so delete is allowed). afterAll deletes
// it through the API if a step failed before.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const NAME = `E2E ${Date.now()}`

let companyId = ''
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

test.describe('Chi nhánh · backend thật', () => {
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
    const res = await request.delete(`${EMP_URL}org/branches/${createdId}`, {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` }
    })
    expect(res.ok(), 'branch cleanup failed').toBe(true)
    await request.dispose()
  })

  test('BR-INT-001 thêm → sửa → tạm ngưng → xem số liệu → xoá', async ({ page, branchesPage }) => {
    await branchesPage.goto(`?companyId=${companyId}`)

    await branchesPage.addButton.click()
    await branchesPage.field('Tên chi nhánh').fill(NAME)
    await branchesPage.field('Thành phố').fill('Hà Nội')
    const created = nextCall(page, 'POST', /\/org\/branches$/)
    await branchesPage.dialog.getByRole('button', { name: 'Thêm chi nhánh' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    createdId = (await res.json()).data.id
    await expect(branchesPage.row(NAME)).toContainText('Hà Nội')

    await branchesPage
      .row(NAME)
      .getByRole('button', { name: `Sửa ${NAME}` })
      .click()
    await branchesPage.field('Điện thoại').fill('0240000001')
    const updated = nextCall(page, 'PUT', /\/org\/branches\/\d+$/)
    await branchesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(branchesPage.row(NAME)).toContainText('0240000001')

    const status = nextCall(page, 'PUT', /\/status$/)
    await branchesPage.row(NAME).getByRole('switch').click()
    expect((await status).ok()).toBe(true)
    await expect(branchesPage.row(NAME)).toContainText('Tạm nghỉ')

    await branchesPage
      .row(NAME)
      .getByRole('button', { name: `Xem ${NAME}` })
      .click()
    await expect(page.getByRole('dialog')).toContainText('Số phòng ban0')
    await page.keyboard.press('Escape')

    await branchesPage
      .row(NAME)
      .getByRole('button', { name: `Xoá ${NAME}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/org\/branches\/\d+$/)
    await branchesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    createdId = ''
    await expect(branchesPage.row(NAME)).toHaveCount(0)
  })
})
