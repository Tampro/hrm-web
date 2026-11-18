// @ts-check
// Feature: plans — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Writes data: creates one plan E2E_PLN_<timestamp> (disabled, never default), edits it, toggles it, then deletes it
// (soft delete). Plan Requests / Plan Orders are only read: approving would change a real company's subscription.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const STAMP = Date.now().toString().slice(-8)
const CODE = `E2E_PLN_${STAMP}`
const NAME = `E2E Plan ${STAMP}`
const RENAMED = `E2E Plan Renamed ${STAMP}`

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} method
 * @param {RegExp} path
 */
const nextCall = (page, method, path) =>
  page.waitForResponse((r) => r.request().method() === method && path.test(new URL(r.url()).pathname))

test.describe('Gói dịch vụ · backend thật', () => {
  test('PLN-INT-001 tạo gói thật (tắt, không mặc định) và thấy thẻ gói', async ({ page, plansPage }) => {
    await plansPage.goto()
    await plansPage.addButton.click()
    await plansPage.field('Mã gói').fill(CODE)
    await plansPage.field('Tên gói').fill(NAME)
    await plansPage.field('Giá theo tháng').fill('12345')
    await plansPage.field('Số tài khoản tối đa').fill('3')
    await plansPage.switchOf('Hoạt động').click()
    const created = nextCall(page, 'POST', /\/api\/v1\/saas\/admin\/plans$/)

    await plansPage.sheet.getByRole('button', { name: 'Tạo gói' }).click()

    const body = await (await created).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data).toEqual(
      expect.objectContaining({ code: CODE, enabled: false, defaultPlan: false, maxUsers: 3, maxEmployees: null })
    )
    const card = plansPage.card(NAME)
    await expect(card).toBeVisible()
    await expect(card.getByRole('switch')).not.toBeChecked()
  })

  test('PLN-INT-002 mã trùng: SAAS_002', async ({ page, plansPage }) => {
    await plansPage.goto()
    await plansPage.addButton.click()
    await plansPage.field('Mã gói').fill(CODE)
    await plansPage.field('Tên gói').fill(`${NAME} dup`)
    await plansPage.field('Giá theo tháng').fill('1')
    await plansPage.switchOf('Hoạt động').click()
    const created = nextCall(page, 'POST', /\/api\/v1\/saas\/admin\/plans$/)

    await plansPage.sheet.getByRole('button', { name: 'Tạo gói' }).click()

    const body = await (await created).json()
    expect(body.code).toBe('SAAS_002')
    await expect(plansPage.toast).toContainText(body.message)
  })

  test('PLN-INT-003 sửa gói: PUT thay toàn bộ, bỏ giới hạn = không giới hạn', async ({ page, plansPage }) => {
    await plansPage.goto()
    await plansPage.card(NAME).getByRole('button', { name: 'Sửa' }).click()
    await plansPage.field('Tên gói').fill(RENAMED)
    await plansPage.field('Số tài khoản tối đa').fill('')
    await plansPage.field('Giá theo năm').fill('99999')
    const updated = nextCall(page, 'PUT', /\/api\/v1\/saas\/admin\/plans\/\d+$/)

    await plansPage.sheet.getByRole('button', { name: 'Lưu' }).click()

    const body = await (await updated).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data).toEqual(expect.objectContaining({ name: RENAMED, maxUsers: null, yearlyPrice: 99999 }))
    await expect(plansPage.card(RENAMED)).toContainText('Không giới hạn')
  })

  test('PLN-INT-004 bật rồi tắt gói', async ({ page, plansPage }) => {
    await plansPage.goto()
    const card = plansPage.card(RENAMED)

    const on = nextCall(page, 'PUT', /\/status$/)
    await card.getByRole('switch').click()
    expect((await (await on).json()).data.enabled).toBe(true)
    await expect(card.getByRole('switch')).toBeChecked()

    const off = nextCall(page, 'PUT', /\/status$/)
    await card.getByRole('switch').click()
    expect((await (await off).json()).data.enabled).toBe(false)
    await expect(card.getByRole('switch')).not.toBeChecked()
  })

  test('PLN-INT-005 xoá gói: không còn trên trang', async ({ page, plansPage }) => {
    await plansPage.goto()
    await plansPage.card(RENAMED).getByRole('button', { name: 'Xoá' }).click()
    const deleted = nextCall(page, 'DELETE', /\/api\/v1\/saas\/admin\/plans\/\d+$/)

    await plansPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    expect((await deleted).ok()).toBe(true)
    await expect(plansPage.card(RENAMED)).toHaveCount(0)
  })

  test('PLN-INT-006 yêu cầu gói và đơn hàng thật: tổng số dòng khớp tab Tất cả', async ({
    page,
    plansPage,
    saasListPage
  }) => {
    for (const [path, list, counts] of [
      ['/requests', /\/saas\/admin\/plan-requests$/, /\/saas\/admin\/plan-requests\/status-counts$/],
      ['/orders', /\/saas\/admin\/orders$/, /\/saas\/admin\/orders\/status-counts$/]
    ]) {
      const listRes = nextCall(page, 'GET', /** @type {RegExp} */ (list))
      const countRes = nextCall(page, 'GET', /** @type {RegExp} */ (counts))
      await plansPage.goto(/** @type {string} */ (path))

      const listData = (await (await listRes).json()).data
      const countData = (await (await countRes).json()).data
      expect(listData.totalElements).toBe(countData.all)
      await expect(saasListPage.showing).toHaveText(`Hiển thị ${listData.content.length} / ${listData.totalElements}`)
      await expect(saasListPage.statusTab('Tất cả')).toContainText(String(countData.all))
    }
  })
})
