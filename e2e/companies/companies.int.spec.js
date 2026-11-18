// @ts-check
// Feature: companies — UI against the REAL IAM backend (project "integration", session from superadmin.setup.js).
// Writes data: creates one company E2E_<timestamp>, changes it, then deletes it (soft delete). Local backend only.
// Spec sources: IAM Swagger + hrm-be CompanyController / CompanyDtos.java.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const STAMP = Date.now().toString().slice(-9)
const CODE = `E2E_${STAMP}`
const NAME = `E2E Company ${STAMP}`
const RENAMED = `E2E Renamed ${STAMP}`
const EMAIL = `e2e.${STAMP}@e2e.invalid`
const ADMIN = { username: `e2e.admin.${STAMP}`, fullName: 'E2E Admin', email: `admin.${STAMP}@e2e.invalid` }

/**
 * Wait for the list response that follows an action and return its parsed body.
 * @param {import('@playwright/test').Page} page
 */
const nextList = (page) =>
  page.waitForResponse((r) => new URL(r.url()).pathname === '/api/v1/iam/companies' && r.request().method() === 'GET')

/**
 * @param {import('../companies/companies.page.js').CompaniesPage} companiesPage
 * @param {string} keyword
 */
const searchFor = async (companiesPage, keyword) => {
  const list = nextList(companiesPage.page)
  await companiesPage.keyword.fill(keyword)
  await companiesPage.searchButton.click()
  return (await list).json()
}

test.describe('Công ty · backend thật', () => {
  test('CMP-INT-001 danh sách thật: tổng số dòng khớp số đếm tab Tất cả', async ({ page, companiesPage }) => {
    const countsResponse = page.waitForResponse((r) => r.url().includes('/api/v1/iam/companies/status-counts'))
    const listResponse = nextList(page)

    await companiesPage.goto()

    const counts = (await (await countsResponse).json()).data
    const list = (await (await listResponse).json()).data
    // Spec (hrm-be code): StatusCountsDto(all, active, inactive) — Swagger shows another schema
    expect(Object.keys(counts).sort()).toEqual(['active', 'all', 'inactive'])
    expect(counts.all).toBe(counts.active + counts.inactive)
    expect(list.totalElements).toBe(counts.all)
    await expect(companiesPage.showing).toHaveText(`Hiển thị ${list.content.length} / ${list.totalElements}`)
    await expect(companiesPage.tab('Tất cả')).toContainText(String(counts.all))
  })

  test('CMP-INT-002 tạo công ty thật: nhận mật khẩu tạm và tìm thấy theo mã', async ({ page, companiesPage }) => {
    await companiesPage.goto()
    await companiesPage.addButton.click()
    const dialog = companiesPage.dialog
    await dialog.getByLabel('Mã công ty').fill(CODE)
    await dialog.getByLabel('Tên công ty').fill(NAME)
    await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill(EMAIL)
    await dialog.getByLabel('Tên đăng nhập quản trị').fill(ADMIN.username)
    await dialog.getByLabel('Họ tên quản trị').fill(ADMIN.fullName)
    await dialog.getByLabel('Email quản trị').fill(ADMIN.email)
    const created = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/v1/iam/companies' && r.request().method() === 'POST'
    )

    await dialog.getByRole('button', { name: 'Tạo công ty' }).click()

    const body = await (await created).json()
    expect(body.result).toBe(true)
    expect(body.data.company.code).toBe(CODE)
    expect(body.data.company.status).toBe('ACTIVE')
    // the temporary password is shown, never asserted by value or logged
    await expect(page.getByTestId('temporary-password')).not.toHaveText('-')
    await page.getByRole('button', { name: 'Tôi đã lưu mật khẩu' }).click()

    const found = await searchFor(companiesPage, CODE)
    expect(found.data.totalElements).toBe(1)
    await expect(companiesPage.row(NAME)).toContainText(CODE)
    await expect(companiesPage.row(NAME)).toContainText('Hoạt động')
  })

  test('CMP-INT-003 mã trùng: backend trả lỗi và hiện message', async ({ page, companiesPage }) => {
    await companiesPage.goto()
    await companiesPage.addButton.click()
    const dialog = companiesPage.dialog
    await dialog.getByLabel('Mã công ty').fill(CODE)
    await dialog.getByLabel('Tên công ty').fill(`${NAME} dup`)
    await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill(`dup.${EMAIL}`)
    await dialog.getByLabel('Tên đăng nhập quản trị').fill(`${ADMIN.username}.dup`)
    await dialog.getByLabel('Họ tên quản trị').fill(ADMIN.fullName)
    await dialog.getByLabel('Email quản trị').fill(`dup.${ADMIN.email}`)
    const created = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/v1/iam/companies' && r.request().method() === 'POST'
    )

    await dialog.getByRole('button', { name: 'Tạo công ty' }).click()

    const res = await created
    expect(res.ok()).toBe(false)
    const body = await res.json()
    expect(body.code).toBe('IAM_002')
    await expect(companiesPage.toast).toContainText(body.message)
    await expect(page.getByTestId('temporary-password')).toHaveCount(0)
  })

  test('CMP-INT-004 sửa tên, xem thông tin, đặt lại mật khẩu và nâng cấp gói', async ({ page, companiesPage }) => {
    await companiesPage.goto()
    await searchFor(companiesPage, CODE)

    // edit
    await companiesPage.rowAction(NAME, 'Sửa')
    await companiesPage.dialog.getByLabel('Tên công ty').fill(RENAMED)
    await companiesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(companiesPage.row(RENAMED)).toBeVisible()

    // info: the first administrator created with the company
    await companiesPage.rowAction(RENAMED, 'Thông tin công ty')
    await expect(companiesPage.dialog).toContainText(ADMIN.username)
    await page.keyboard.press('Escape')
    await expect(companiesPage.dialog).toHaveCount(0)

    // reset password of the default administrator
    await companiesPage.rowAction(RENAMED, 'Đặt lại mật khẩu')
    await companiesPage.dialog.getByLabel('Mật khẩu mới').fill(`E2e-${STAMP}-Pass!`)
    const reset = page.waitForResponse((r) => r.url().includes('/reset-password'))
    await companiesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    const resetBody = await (await reset).json()
    expect(resetBody.result, `reset-password: ${resetBody.code} ${resetBody.message}`).toBe(true)
    expect(resetBody.data.username).toBe(ADMIN.username)

    // upgrade plan: pick the first plan that is not the current one, yearly
    await companiesPage.rowAction(RENAMED, 'Nâng cấp gói')
    const radios = companiesPage.dialog.getByRole('radio')
    await expect(radios.first()).toBeVisible()
    test.skip((await radios.count()) < 2, 'Only one enabled plan on this backend — nothing to upgrade to')
    const target = companiesPage.dialog.locator('[role="radio"][aria-checked="false"]').first()
    const targetName = (await target.locator('span').first().textContent())?.trim() ?? ''
    await companiesPage.dialog.getByRole('tab', { name: 'Theo năm' }).click()
    await target.click()
    const upgraded = page.waitForResponse((r) => r.url().endsWith('/plan') && r.request().method() === 'PUT')
    const list = nextList(page)
    await companiesPage.dialog.getByRole('button', { name: 'Nâng cấp' }).click()
    const upgradeBody = await (await upgraded).json()
    expect(upgradeBody.result, `upgrade: ${upgradeBody.code} ${upgradeBody.message}`).toBe(true)
    await list
    await expect(companiesPage.row(RENAMED)).toContainText(targetName)
  })

  test('CMP-INT-005 khoá rồi mở đăng nhập: trạng thái và tab đổi theo', async ({ page, companiesPage }) => {
    await companiesPage.goto()
    await searchFor(companiesPage, CODE)

    await companiesPage.rowAction(RENAMED, 'Khoá đăng nhập')
    const disabled = page.waitForResponse((r) => r.url().endsWith('/status'))
    await companiesPage.alertDialog.getByRole('button', { name: 'Khoá đăng nhập' }).click()
    expect((await (await disabled).json()).data.status).toBe('SUSPENDED')
    await expect(companiesPage.row(RENAMED)).toContainText('Tạm khoá')

    await companiesPage.tab('Tạm khoá').click()
    await expect(companiesPage.row(RENAMED)).toBeVisible()

    await companiesPage.rowAction(RENAMED, 'Mở đăng nhập')
    const enabled = page.waitForResponse((r) => r.url().endsWith('/status'))
    await companiesPage.alertDialog.getByRole('button', { name: 'Mở đăng nhập' }).click()
    expect((await (await enabled).json()).data.status).toBe('ACTIVE')
    await expect(companiesPage.row(RENAMED)).toHaveCount(0)
  })

  test('CMP-INT-006 xoá công ty: không còn trong danh sách', async ({ page, companiesPage }) => {
    await companiesPage.goto()
    await searchFor(companiesPage, CODE)

    await companiesPage.rowAction(RENAMED, 'Xoá')
    const deleted = page.waitForResponse((r) => r.request().method() === 'DELETE')
    const list = nextList(page)
    await companiesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    expect((await deleted).ok()).toBe(true)
    expect((await (await list).json()).data.totalElements).toBe(0)
    await expect(companiesPage.table).toContainText('Không có công ty phù hợp với bộ lọc')
  })
})
