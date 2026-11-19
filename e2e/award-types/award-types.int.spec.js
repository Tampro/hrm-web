// @ts-check
// Feature: award types — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Through the UI: creates ONE award type "E2E <ts>", edits it, deactivates it, deletes it. afterAll deletes it
// through the API if a step failed before.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const NAME = `E2E khen thưởng ${Date.now()}`

let companyId = ''
let createdId = ''

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

test.describe('Loại khen thưởng · backend thật', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    const companies = await request.get(`${IAM_URL}iam/companies`, { headers: headers(), params: { size: 50 } })
    companyId = (await companies.json()).data.content.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    expect(companyId, 'no active company to test with').not.toBe('')
    await request.dispose()
  })

  test.afterAll(async ({ playwright }) => {
    if (!createdId) return
    const request = await playwright.request.newContext()
    const res = await request.delete(`${EMP_URL}org/award-types/${createdId}`, { headers: headers() })
    expect(res.ok(), 'award type cleanup failed').toBe(true)
    await request.dispose()
  })

  test('AWD-INT-001 thêm (biểu tượng medal) → sửa → tạm ngưng → xoá', async ({ page, awardTypesPage }) => {
    await awardTypesPage.goto(`?companyId=${companyId}`)

    const form = awardTypesPage.addForm
    await form.getByRole('textbox', { name: 'Tên loại khen thưởng' }).fill(NAME)
    await form.getByRole('radio', { name: 'Biểu tượng medal' }).click()
    const created = nextCall(page, 'POST', /\/org\/award-types$/)
    await form.getByRole('button', { name: 'Thêm loại khen thưởng' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    const body = (await res.json()).data
    createdId = body.id
    expect(body.icon).toBe('medal')
    await expect(awardTypesPage.row(NAME)).toContainText('Hoạt động')

    await awardTypesPage
      .row(NAME)
      .getByRole('button', { name: `Sửa ${NAME}` })
      .click()
    await awardTypesPage.editForm.getByRole('textbox', { name: 'Mô tả' }).fill('Tạo bởi E2E')
    const updated = nextCall(page, 'PUT', /\/org\/award-types\/\d+$/)
    await awardTypesPage.editForm.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(awardTypesPage.row(NAME)).toContainText('Tạo bởi E2E')

    const status = nextCall(page, 'PUT', /\/status$/)
    await page.getByRole('button', { name: `Tạm ngưng ${NAME}` }).click()
    expect((await status).ok()).toBe(true)
    await expect(awardTypesPage.row(NAME)).toContainText('Tạm nghỉ')

    await page.getByRole('button', { name: `Xoá ${NAME}` }).click()
    const deleted = nextCall(page, 'DELETE', /\/org\/award-types\/\d+$/)
    await awardTypesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    createdId = ''
    await expect(awardTypesPage.row(NAME)).toHaveCount(0)
  })
})
