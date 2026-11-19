// @ts-check
// Feature: designations — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Creates its own branch + department "E2E <ts>" through the API, then through the UI one designation in it:
// create → view → edit → deactivate → delete. afterAll removes what is left: designation, department, branch.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const STAMP = Date.now()
const BRANCH = `E2E ${STAMP}`
const DEPARTMENT = `E2E phòng ${STAMP}`
const NAME = `E2E chức danh ${STAMP}`

let companyId = ''
let branchId = ''
let departmentId = ''
let designationId = ''

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

test.describe('Chức danh · backend thật', () => {
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
    const department = await request.post(`${EMP_URL}org/departments`, {
      headers: headers(),
      params: { companyId },
      data: { name: DEPARTMENT, branchId: Number(branchId) }
    })
    expect(department.ok(), await department.text()).toBe(true)
    departmentId = (await department.json()).data.id
    await request.dispose()
  })

  test.afterAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    for (const [path, id] of [
      ['org/designations', designationId],
      ['org/departments', departmentId],
      ['org/branches', branchId]
    ]) {
      if (!id) continue
      const res = await request.delete(`${EMP_URL}${path}/${id}`, { headers: headers() })
      expect(res.ok(), `${path} cleanup failed`).toBe(true)
    }
    await request.dispose()
  })

  test('DES-INT-001 thêm → xem → sửa → tạm ngưng → xoá', async ({ page, designationsPage }) => {
    await designationsPage.goto(`?companyId=${companyId}`)

    await designationsPage.addButton.click()
    await designationsPage.field('Tên chức danh').fill(NAME)
    await designationsPage.choose('Phòng ban', `${DEPARTMENT} · ${BRANCH}`, designationsPage.dialog)
    const created = nextCall(page, 'POST', /\/org\/designations$/)
    await designationsPage.dialog.getByRole('button', { name: 'Tạo chức danh' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    designationId = (await res.json()).data.id
    await expect(designationsPage.row(NAME)).toContainText(BRANCH)

    await designationsPage
      .row(NAME)
      .getByRole('button', { name: `Xem ${NAME}` })
      .click()
    await expect(page.getByRole('dialog')).toContainText('Số nhân viên0')
    await page.keyboard.press('Escape')

    await designationsPage
      .row(NAME)
      .getByRole('button', { name: `Sửa ${NAME}` })
      .click()
    await designationsPage.field('Mô tả').fill('Chức danh tạo bởi E2E')
    const updated = nextCall(page, 'PUT', /\/org\/designations\/\d+$/)
    await designationsPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(designationsPage.row(NAME)).toContainText('Chức danh tạo bởi E2E')

    const status = nextCall(page, 'PUT', /\/status$/)
    await designationsPage.row(NAME).getByRole('switch').click()
    expect((await status).ok()).toBe(true)
    await expect(designationsPage.row(NAME)).toContainText('Tạm nghỉ')

    await designationsPage
      .row(NAME)
      .getByRole('button', { name: `Xoá ${NAME}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/org\/designations\/\d+$/)
    await designationsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    designationId = ''
    await expect(designationsPage.row(NAME)).toHaveCount(0)
  })
})
