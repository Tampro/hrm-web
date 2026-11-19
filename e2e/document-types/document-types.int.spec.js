// @ts-check
// Feature: document types — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Through the UI: creates ONE document type "E2E <ts>" (Required), edits it to Optional, deletes it. System types
// are not changed here (their Required is a company setting). afterAll deletes the type if a step failed.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const NAME = `E2E tài liệu ${Date.now()}`

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

test.describe('Loại tài liệu · backend thật', () => {
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
    const res = await request.delete(`${EMP_URL}org/document-types/${createdId}`, { headers: headers() })
    expect(res.ok(), 'document type cleanup failed').toBe(true)
    await request.dispose()
  })

  test('DOC-INT-001 thêm (Bắt buộc) → sửa thành Không bắt buộc → xoá', async ({ page, documentTypesPage }) => {
    await documentTypesPage.goto(`?companyId=${companyId}`)

    const form = documentTypesPage.addForm
    await form.getByRole('textbox', { name: 'Tên loại tài liệu' }).fill(NAME)
    await form.getByRole('radio', { name: 'Bắt buộc', exact: true }).check()
    const created = nextCall(page, 'POST', /\/org\/document-types$/)
    await form.getByRole('button', { name: 'Thêm loại tài liệu' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    const body = (await res.json()).data
    createdId = body.id
    expect(body.required).toBe(true)
    expect(body.system).toBe(false)
    await expect(documentTypesPage.row(NAME)).toContainText('Bắt buộc')

    await page.getByRole('button', { name: `Sửa ${NAME}` }).click()
    await documentTypesPage.editForm.getByRole('radio', { name: 'Không bắt buộc' }).check()
    const updated = nextCall(page, 'PUT', /\/org\/document-types\/\d+$/)
    await documentTypesPage.editForm.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(documentTypesPage.row(NAME)).toContainText('Không bắt buộc')

    await page.getByRole('button', { name: `Xoá ${NAME}` }).click()
    const deleted = nextCall(page, 'DELETE', /\/org\/document-types\/\d+$/)
    await documentTypesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    createdId = ''
    await expect(documentTypesPage.row(NAME)).toHaveCount(0)
  })
})
