// @ts-check
// Feature: holidays — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Through the UI: creates one category "E2E <ts>" and one holiday in it (all branches), checks list, calendar and
// detail, edits, deletes the holiday and then the category. afterAll removes whatever a failed step left behind.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
const STAMP = Date.now()
const CATEGORY = `E2E ${STAMP}`
const NAME = `E2E lễ ${STAMP}`

let companyId = ''
let categoryId = ''
let holidayId = ''

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

test.describe('Ngày lễ · backend thật', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    const companies = await request.get(`${IAM_URL}iam/companies`, { headers: headers(), params: { size: 50 } })
    companyId = (await companies.json()).data.content.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    expect(companyId, 'no active company to test with').not.toBe('')
    await request.dispose()
  })

  test.afterAll(async ({ playwright }) => {
    const request = await playwright.request.newContext()
    if (holidayId) {
      const res = await request.delete(`${EMP_URL}org/holidays/${holidayId}`, { headers: headers() })
      expect(res.ok(), 'holiday cleanup failed').toBe(true)
    }
    if (categoryId) {
      const res = await request.delete(`${EMP_URL}org/holiday-categories/${categoryId}`, { headers: headers() })
      expect(res.ok(), 'category cleanup failed').toBe(true)
    }
    await request.dispose()
  })

  test('HOL-INT-001 loại riêng → ngày lễ 2 ngày → danh sách, lịch, chi tiết → sửa → xoá ngày lễ và loại', async ({
    page,
    holidaysPage
  }) => {
    // one long flow against the real backend (two dialogs, list, calendar, sheet)
    test.setTimeout(120_000)
    await holidaysPage.goto(`?companyId=${companyId}`)

    await holidaysPage.categoriesButton.click()
    await holidaysPage.dialog.getByRole('textbox', { name: 'Thêm loại' }).fill(CATEGORY)
    const category = nextCall(page, 'POST', /\/holiday-categories$/)
    await holidaysPage.dialog.getByRole('button', { name: 'Thêm loại' }).click()
    const categoryRes = await category
    expect(categoryRes.ok(), await categoryRes.text()).toBe(true)
    categoryId = (await categoryRes.json()).data.id
    // the dialog ignores Escape while the save is still finishing (refetch after the POST)
    await expect(holidaysPage.toast.filter({ hasText: 'Đã thêm loại ngày lễ' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(holidaysPage.dialog).toHaveCount(0)

    await holidaysPage.addButton.click()
    await holidaysPage.field('Tên ngày lễ').fill(NAME)
    await holidaysPage.choose('Loại', CATEGORY, holidaysPage.dialog)
    await holidaysPage.pickDay('Ngày bắt đầu', 10, holidaysPage.dialog)
    await holidaysPage.pickDay('Ngày kết thúc', 11, holidaysPage.dialog)
    const created = nextCall(page, 'POST', /\/org\/holidays$/)
    await holidaysPage.dialog.getByRole('button', { name: 'Thêm ngày lễ' }).click()
    const res = await created
    expect(res.ok(), await res.text()).toBe(true)
    const holiday = (await res.json()).data
    holidayId = holiday.id
    expect(holiday.days).toBe(2)
    expect(holiday.allBranches).toBe(true)
    await expect(holidaysPage.row(NAME)).toContainText('2 ngày')
    await expect(holidaysPage.row(NAME)).toContainText('Tất cả chi nhánh')

    await page.getByRole('button', { name: 'Xem lịch' }).click()
    const cell = holidaysPage.calendar.getByRole('gridcell', {
      name: `11/${holiday.startDate.slice(5, 7)}/${holiday.startDate.slice(0, 4)}`
    })
    await expect(cell).toContainText(NAME)
    await cell.getByRole('button', { name: NAME }).click()
    await expect(page.getByRole('dialog')).toContainText(CATEGORY)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Xem danh sách' }).click()

    await holidaysPage
      .row(NAME)
      .getByRole('button', { name: `Sửa ${NAME}` })
      .click()
    await holidaysPage.dialog.getByRole('textbox', { name: 'Mô tả' }).fill('Tạo bởi E2E')
    const updated = nextCall(page, 'PUT', /\/org\/holidays\/\d+$/)
    await holidaysPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(holidaysPage.row(NAME)).toContainText('Tạo bởi E2E')

    await holidaysPage
      .row(NAME)
      .getByRole('button', { name: `Xoá ${NAME}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/org\/holidays\/\d+$/)
    await holidaysPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    expect((await deleted).ok()).toBe(true)
    holidayId = ''
    await expect(holidaysPage.row(NAME)).toHaveCount(0)

    await holidaysPage.categoriesButton.click()
    const categoryDeleted = nextCall(page, 'DELETE', /\/holiday-categories\/\d+$/)
    await holidaysPage.dialog.getByRole('button', { name: `Xoá loại ${CATEGORY}` }).click()
    expect((await categoryDeleted).ok()).toBe(true)
    categoryId = ''
  })
})
