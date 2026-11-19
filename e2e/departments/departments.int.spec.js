// @ts-check
// Feature: departments — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Creates its own branch "E2E <ts>" through the API (a department needs one), then through the UI one department
// in it: select → edit → deactivate → delete. afterAll deletes whatever is left: department first, then the branch.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const STAMP = Date.now()
const BRANCH = `E2E ${STAMP}`
const NAME = `E2E phòng ${STAMP}`

let companyId = ''
let branchId = ''
let departmentId = ''

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

test.describe('Phòng ban · backend thật', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    const companies = await request.get(`${IAM_URL}iam/companies`, { headers: headers(), params: { size: 50 } })
    companyId = (await companies.json()).data.content.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    expect(companyId, 'no active company to test with').not.toBe('')
    const branch = await request.post(`${EMP_URL}org/branches`, {
      headers: headers(),
      params: { companyId },
      data: { name: BRANCH }
    })
    expect(branch.ok(), await branch.text()).toBe(true)
    branchId = (await branch.json()).data.id
    await request.dispose()
  })

  test.afterAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    if (departmentId) {
      const res = await request.delete(`${EMP_URL}org/departments/${departmentId}`, { headers: headers() })
      expect(res.ok(), 'department cleanup failed').toBe(true)
    }
    if (branchId) {
      const res = await request.delete(`${EMP_URL}org/branches/${branchId}`, { headers: headers() })
      expect(res.ok(), 'branch cleanup failed').toBe(true)
    }
    await request.dispose()
  })

  test('DEP-INT-001 thêm → xem khung chi tiết → sửa → tạm ngưng → xoá', async ({ page, departmentsPage }) => {
    await departmentsPage.goto(`?companyId=${companyId}`)

    await departmentsPage.addButton.click()
    await departmentsPage.field('Tên phòng ban').fill(NAME)
    await departmentsPage.choose('Chi nhánh', BRANCH, departmentsPage.dialog)
    const created = nextCall(page, 'POST', /\/org\/departments$/)
    await departmentsPage.dialog.getByRole('button', { name: 'Tạo phòng ban' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    departmentId = (await res.json()).data.id
    await expect(departmentsPage.row(NAME)).toContainText(BRANCH)

    await page.getByRole('button', { name: `Xem phòng ban ${NAME}` }).click()
    await expect(departmentsPage.panel).toContainText('Nhân sự0')

    await departmentsPage.panel.getByRole('button', { name: 'Sửa phòng ban' }).click()
    await departmentsPage.field('Mô tả chức năng').fill('Phòng tạo bởi E2E')
    const updated = nextCall(page, 'PUT', /\/org\/departments\/\d+$/)
    await departmentsPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(departmentsPage.row(NAME)).toContainText('Phòng tạo bởi E2E')

    const status = nextCall(page, 'PUT', /\/status$/)
    await departmentsPage.row(NAME).getByRole('switch').click()
    expect((await status).ok()).toBe(true)
    await expect(departmentsPage.row(NAME)).toContainText('Tạm nghỉ')

    await departmentsPage
      .row(NAME)
      .getByRole('button', { name: `Xoá ${NAME}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/org\/departments\/\d+$/)
    await departmentsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    departmentId = ''
    await expect(departmentsPage.row(NAME)).toHaveCount(0)
  })
})
