// @ts-check
// Feature: coupons — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Writes data: creates one coupon E2E_CPN_<timestamp> (inactive), edits it, toggles it, then deletes it (soft delete:
// the code is freed). No order uses it, so no company is affected.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN } from '../utils/credentials.js'
import { waitForListResponse } from '../utils/wait-for.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const STAMP = Date.now().toString().slice(-8)
const CODE = `E2E_CPN_${STAMP}`
const NAME = `E2E Coupon ${STAMP}`
const RENAMED = `E2E Coupon Renamed ${STAMP}`

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} method
 * @param {RegExp} path
 */
const nextCall = (page, method, path) =>
  page.waitForResponse((r) => r.request().method() === method && path.test(new URL(r.url()).pathname))

/**
 * @param {import('./coupons.page.js').CouponsPage} couponsPage
 * @param {string} keyword
 */
const searchFor = async (couponsPage, keyword) => {
  const list = waitForListResponse(couponsPage.page, '/api/v1/saas/admin/coupons', { keyword })
  await couponsPage.keyword.fill(keyword)
  await couponsPage.searchButton.click()
  return (await (await list).json()).data
}

test.describe('Mã giảm giá · backend thật', () => {
  test('CPN-INT-001 tạo mã thủ công thật rồi tắt nó', async ({ page, couponsPage }) => {
    await couponsPage.goto()
    await couponsPage.addButton.click()
    await couponsPage.field('Tên mã giảm giá').fill(NAME)
    await couponsPage.field('Giá trị giảm').fill('15')
    await couponsPage.field('Mã').fill(CODE)
    await couponsPage.field('Tổng lượt dùng').fill('5')
    const created = nextCall(page, 'POST', /\/api\/v1\/saas\/admin\/coupons$/)

    await couponsPage.dialog.getByRole('button', { name: 'Tạo mã' }).click()

    const body = await (await created).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data).toEqual(
      expect.objectContaining({ code: CODE, type: 'PERCENTAGE', discountValue: 15, useLimitTotal: 5, enabled: true })
    )
    // keep it inactive so no real company can use it while the test runs
    await searchFor(couponsPage, CODE)
    const toggled = nextCall(page, 'PUT', /\/status$/)
    await couponsPage.row(NAME).getByRole('switch').click()
    expect((await (await toggled).json()).data.enabled).toBe(false)
  })

  test('CPN-INT-002 mã trùng: SAAS_005', async ({ page, couponsPage }) => {
    await couponsPage.goto()
    await couponsPage.addButton.click()
    await couponsPage.field('Tên mã giảm giá').fill(`${NAME} dup`)
    await couponsPage.field('Giá trị giảm').fill('1')
    await couponsPage.field('Mã').fill(CODE)
    const created = nextCall(page, 'POST', /\/api\/v1\/saas\/admin\/coupons$/)

    await couponsPage.dialog.getByRole('button', { name: 'Tạo mã' }).click()

    const body = await (await created).json()
    expect(body.code).toBe('SAAS_005')
    await expect(couponsPage.toast).toContainText(body.message)
  })

  test('CPN-INT-003 sửa mã đang tắt: vẫn tắt sau khi lưu (PUT thay toàn bộ)', async ({ page, couponsPage }) => {
    await couponsPage.goto()
    await searchFor(couponsPage, CODE)
    await couponsPage
      .row(NAME)
      .getByRole('button', { name: `Sửa ${NAME}` })
      .click()
    await couponsPage.field('Tên mã giảm giá').fill(RENAMED)
    await couponsPage.field('Tổng lượt dùng').fill('')
    const updated = nextCall(page, 'PUT', /\/api\/v1\/saas\/admin\/coupons\/\d+$/)

    await couponsPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    const body = await (await updated).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data).toEqual(expect.objectContaining({ name: RENAMED, enabled: false, useLimitTotal: null }))
  })

  test('CPN-INT-004 trang chi tiết thật: thẻ tóm tắt và lịch sử rỗng', async ({ page, couponsPage }) => {
    await couponsPage.goto()
    const found = await searchFor(couponsPage, CODE)
    await couponsPage.row(RENAMED).getByRole('cell').first().click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/coupons/${found.content[0].id}$`))
    await expect(page.getByRole('heading', { name: RENAMED, level: 1 })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Tóm tắt mã giảm giá' })).toContainText('15%')
    await expect(page.getByText('Mã chưa được sử dụng')).toBeVisible()
  })

  test('CPN-INT-005 xoá mã: không còn trong danh sách', async ({ page, couponsPage }) => {
    await couponsPage.goto()
    await searchFor(couponsPage, CODE)
    await couponsPage
      .row(RENAMED)
      .getByRole('button', { name: `Xoá ${RENAMED}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/api\/v1\/saas\/admin\/coupons\/\d+$/)
    const list = nextCall(page, 'GET', /\/api\/v1\/saas\/admin\/coupons$/)

    await couponsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    expect((await deleted).ok()).toBe(true)
    expect((await (await list).json()).data.totalElements).toBe(0)
  })
})
