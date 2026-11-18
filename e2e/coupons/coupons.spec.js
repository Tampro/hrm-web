// @ts-check
// Feature: coupons (manual 3.2.4). Spec sources: hrm-be CouponController (GET list: keyword, type, dateFrom, dateTo,
// active; status-counts; GET /{id}; POST; PUT /{id} full replacement; PUT /{id}/status; DELETE soft) and
// CouponDtos.CouponForm validation; messages SAAS_005, SAAS_012, SAAS_020, SAAS_021.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'
import { VND } from '../plans/data.js'
import { COUPON_COUNTS, COUPON_DETAIL, COUPON_FLAT, COUPON_PERCENT } from './data.js'

test.describe('Mã giảm giá · quyền', () => {
  test('CPN-001 @smoke người không phải super admin: không có menu và không gọi API', async ({
    page,
    api,
    baseURL,
    couponsPage
  }) => {
    await api.signIn(String(baseURL), FAKE_ME)
    const listCalls = await api.route('/saas/admin/coupons', { body: ok(pageOf([COUPON_PERCENT])) })

    await couponsPage.goto()

    await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Mã giảm giá' })).toHaveCount(0)
    expect(listCalls).toHaveLength(0)
  })
})

test.describe('Mã giảm giá · danh sách', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/saas/currencies', { body: ok([VND]) })
    await api.route('/saas/admin/coupons/status-counts', { body: ok(COUPON_COUNTS) })
  })

  test('CPN-002 @smoke cột: mức giảm theo % / tiền, chi tiêu, lượt dùng, hạn, trạng thái', async ({
    api,
    couponsPage
  }) => {
    const listCalls = await api.route('/saas/admin/coupons', {
      method: 'GET',
      body: ok(pageOf([COUPON_PERCENT, COUPON_FLAT]))
    })

    await couponsPage.goto()

    const percent = couponsPage.row('E2E Summer')
    await expect(percent).toContainText('E2E_SUMMER20')
    await expect(percent).toContainText('Phần trăm')
    await expect(percent).toContainText('20%')
    await expect(percent).toContainText('400.000')
    await expect(percent).toContainText('3 / 100')
    await expect(percent).toContainText('31/12/2026')
    await expect(percent.getByRole('switch')).toBeChecked()
    const flat = couponsPage.row('E2E Flat')
    await expect(flat).toContainText('Số tiền cố định')
    await expect(flat).toContainText('50.000')
    await expect(flat).toContainText('Không hết hạn')
    await expect(flat).toContainText('0 / Không giới hạn')
    await expect(flat.getByRole('switch')).not.toBeChecked()
    await expect(couponsPage.statusTab('Hoạt động')).toContainText('1')
    expect(listCalls[0].query.has('active')).toBe(false)
    expect(listCalls[0].query.has('type')).toBe(false)
  })

  test('CPN-003 tab Không hoạt động gửi active=false, Hoạt động gửi active=true', async ({
    page,
    api,
    couponsPage
  }) => {
    const listCalls = await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([COUPON_FLAT])) })
    await couponsPage.goto()

    await couponsPage.statusTab('Không hoạt động').click()
    await expect(page).toHaveURL(/tab=INACTIVE/)
    await expect.poll(() => listCalls.at(-1)?.query.get('active')).toBe('false')

    await couponsPage.statusTab('Hoạt động').click()
    await expect.poll(() => listCalls.at(-1)?.query.get('active')).toBe('true')
  })

  test('CPN-004 lọc theo loại và từ khoá; counts nhận cùng bộ lọc; xoá bộ lọc', async ({ page, api, couponsPage }) => {
    const listCalls = await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([COUPON_FLAT])) })
    const countCalls = await api.route('/saas/admin/coupons/status-counts', { body: ok(COUPON_COUNTS) })
    await couponsPage.goto()

    await couponsPage.typeFilter.click()
    await page.getByRole('option', { name: 'Số tiền cố định' }).click()
    await couponsPage.keyword.fill(' flat ')
    await couponsPage.searchButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.get('type')).toBe('FLAT')
    expect(listCalls.at(-1)?.query.get('keyword')).toBe('flat')
    await expect.poll(() => countCalls.at(-1)?.query.get('type')).toBe('FLAT')
    await expect(couponsPage.searchButton).toContainText('2')

    await couponsPage.clearButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.has('type')).toBe(false)
    await expect(page).not.toHaveURL(/type=|keyword=/)
  })

  test('CPN-005 ?type= lạ trên URL bị bỏ qua (về Tất cả loại)', async ({ api, couponsPage }) => {
    const listCalls = await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([])) })

    await couponsPage.goto('', '?type=HACKED')

    await expect(couponsPage.table).toContainText('Chưa có mã giảm giá nào')
    expect(listCalls.every((c) => !c.query.has('type'))).toBe(true)
    await expect(couponsPage.typeFilter).toContainText('Tất cả loại')
  })

  test('CPN-006 bật/tắt từ danh sách gửi PUT status và không mở trang chi tiết', async ({ page, api, couponsPage }) => {
    await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([COUPON_PERCENT, COUPON_FLAT])) })
    const statusCalls = await api.route(`/saas/admin/coupons/${COUPON_FLAT.id}/status`, {
      method: 'PUT',
      body: ok({ ...COUPON_FLAT, enabled: true })
    })
    await couponsPage.goto()

    await couponsPage.row('E2E Flat').getByRole('switch').click()

    await expect(couponsPage.toast.filter({ hasText: 'Đã bật mã giảm giá' })).toBeVisible()
    expect(statusCalls[0].body).toEqual({ enabled: true })
    await expect(page).toHaveURL(/\/dashboard\/coupons(\?|$)/)
  })

  test('CPN-007 bấm dòng mở trang chi tiết; xoá có xác nhận và gọi DELETE', async ({ page, api, couponsPage }) => {
    await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([COUPON_PERCENT])) })
    const deleteCalls = await api.route(`/saas/admin/coupons/${COUPON_PERCENT.id}`, {
      method: 'DELETE',
      body: ok(null)
    })
    await couponsPage.goto()

    await couponsPage.row('E2E Summer').getByRole('button', { name: 'Xoá E2E Summer' }).click()
    await expect(couponsPage.alertDialog).toContainText('E2E_SUMMER20')
    await couponsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect(couponsPage.toast.filter({ hasText: 'Đã xoá mã giảm giá' })).toBeVisible()
    expect(deleteCalls).toHaveLength(1)
    await expect(page).toHaveURL(/\/dashboard\/coupons(\?|$)/)

    await couponsPage.row('E2E Summer').getByRole('cell').first().click()
    await expect(page).toHaveURL(/\/dashboard\/coupons\/301$/)
  })
})

test.describe('Mã giảm giá · tạo và sửa', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/saas/currencies', { body: ok([VND]) })
    await api.route('/saas/admin/coupons/status-counts', { body: ok(COUPON_COUNTS) })
    await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([COUPON_PERCENT, COUPON_FLAT])) })
  })

  test('CPN-101 validation: bắt buộc, % > 100, mã sai, min > max, lượt dùng 0', async ({ api, couponsPage }) => {
    const createCalls = await api.route('/saas/admin/coupons', { method: 'POST', body: ok(COUPON_PERCENT) })
    await couponsPage.goto()
    await couponsPage.addButton.click()

    await couponsPage.dialog.getByRole('button', { name: 'Tạo mã' }).click()
    await expect(couponsPage.dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(3)

    await couponsPage.field('Giá trị giảm').fill('101')
    await couponsPage.field('Mã').fill('summer 25')
    await couponsPage.field('Chi tiêu tối thiểu').fill('500')
    await couponsPage.field('Chi tiêu tối đa').fill('100')
    await couponsPage.field('Tổng lượt dùng').fill('0')

    await expect(couponsPage.dialog.getByText('Giảm theo phần trăm tối đa 100')).toBeVisible()
    await expect(couponsPage.dialog.getByText('Chỉ gồm chữ in hoa, số, dấu gạch dưới và gạch ngang')).toBeVisible()
    await expect(couponsPage.dialog.getByText('Mức chi tiêu tối đa phải lớn hơn hoặc bằng mức tối thiểu')).toBeVisible()
    await expect(couponsPage.dialog.getByText('Giá trị tối thiểu là 1')).toBeVisible()
    expect(createCalls).toHaveLength(0)
  })

  test('CPN-102 @smoke tạo mã tự sinh: không gửi code, ô trống bị bỏ khỏi payload, hiện mã được tạo', async ({
    page,
    api,
    couponsPage
  }) => {
    const createCalls = await api.route('/saas/admin/coupons', {
      method: 'POST',
      body: ok({ ...COUPON_FLAT, id: '399', code: 'E2EGEN01' })
    })
    await couponsPage.goto()
    await couponsPage.addButton.click()

    await couponsPage.field('Tên mã giảm giá').fill('  E2E Black Friday  ')
    await couponsPage.dialog.getByRole('combobox', { name: 'Loại giảm giá' }).click()
    await page.getByRole('option', { name: 'Số tiền cố định' }).click()
    // a flat amount above 100 is fine (the 100 cap is for percentages)
    await couponsPage.field('Giá trị giảm').fill('150000')
    await couponsPage.dialog.getByRole('tab', { name: 'Tự sinh' }).click()
    await expect(couponsPage.field('Mã')).toHaveCount(0)
    await couponsPage.field('Lượt dùng mỗi công ty').fill('2')
    await couponsPage.dialog.getByRole('button', { name: 'Tạo mã' }).click()

    await expect(couponsPage.toast.filter({ hasText: 'Đã tạo mã E2EGEN01' })).toBeVisible()
    expect(createCalls[0].body).toEqual({
      name: 'E2E Black Friday',
      type: 'FLAT',
      discountValue: 150000,
      codeGeneration: 'AUTO',
      useLimitPerCompany: 2
    })
  })

  test('CPN-103 sửa mã đang tắt: giữ enabled=false (PUT thay toàn bộ, bỏ trống = bật)', async ({
    api,
    couponsPage
  }) => {
    const updateCalls = await api.route(`/saas/admin/coupons/${COUPON_FLAT.id}`, {
      method: 'PUT',
      body: ok(COUPON_FLAT)
    })
    await couponsPage.goto()

    await couponsPage.row('E2E Flat').getByRole('button', { name: 'Sửa E2E Flat' }).click()
    // AUTO code is kept on update: shown read-only
    await expect(couponsPage.dialog.getByRole('textbox', { name: 'Mã', exact: true })).toBeDisabled()
    await expect(couponsPage.dialog.getByRole('textbox', { name: 'Mã', exact: true })).toHaveValue('E2EAUTO8')
    await couponsPage.field('Tên mã giảm giá').fill('E2E Flat Renamed')
    await couponsPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect(couponsPage.toast.filter({ hasText: 'Đã cập nhật mã giảm giá' })).toBeVisible()
    expect(updateCalls[0].body).toEqual({
      name: 'E2E Flat Renamed',
      type: 'FLAT',
      discountValue: 50000,
      codeGeneration: 'AUTO',
      enabled: false
    })
  })

  test('CPN-104 sửa mã thủ công: gửi lại đầy đủ code, giới hạn và hạn dùng', async ({ api, couponsPage }) => {
    const updateCalls = await api.route(`/saas/admin/coupons/${COUPON_PERCENT.id}`, {
      method: 'PUT',
      body: ok(COUPON_PERCENT)
    })
    await couponsPage.goto()

    await couponsPage.row('E2E Summer').getByRole('button', { name: 'Sửa E2E Summer' }).click()
    await couponsPage.field('Giá trị giảm').fill('25')
    await couponsPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => updateCalls.length).toBe(1)
    expect(updateCalls[0].body).toEqual({
      name: 'E2E Summer',
      type: 'PERCENTAGE',
      discountValue: 25,
      codeGeneration: 'MANUAL',
      code: 'E2E_SUMMER20',
      minimumSpend: 400000,
      useLimitTotal: 100,
      useLimitPerCompany: 1,
      expiryDate: '2026-12-31',
      enabled: true
    })
  })

  test('CPN-105 mã trùng: hiện message SAAS_005, dialog vẫn mở', async ({ api, couponsPage }) => {
    await api.route('/saas/admin/coupons', {
      method: 'POST',
      status: 409,
      body: fail('SAAS_005', 'Mã giảm giá đã được sử dụng.')
    })
    await couponsPage.goto()
    await couponsPage.addButton.click()
    await couponsPage.field('Tên mã giảm giá').fill('Dup')
    await couponsPage.field('Giá trị giảm').fill('10')
    await couponsPage.field('Mã').fill('E2E_SUMMER20')

    await couponsPage.dialog.getByRole('button', { name: 'Tạo mã' }).click()

    await expect(couponsPage.toast).toContainText('Mã giảm giá đã được sử dụng.')
    await expect(couponsPage.field('Mã')).toHaveValue('E2E_SUMMER20')
  })
})

test.describe('Mã giảm giá · chi tiết', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/saas/currencies', { body: ok([VND]) })
  })

  test('CPN-201 @smoke thẻ tóm tắt, thông tin mã và lịch sử sử dụng', async ({ page, api, couponsPage }) => {
    await api.route(`/saas/admin/coupons/${COUPON_PERCENT.id}`, { method: 'GET', body: ok(COUPON_DETAIL) })

    await couponsPage.goto(`/${COUPON_PERCENT.id}`)

    await expect(page.getByRole('heading', { name: 'E2E Summer', level: 1 })).toBeVisible()
    const summary = page.getByRole('region', { name: 'Tóm tắt mã giảm giá' })
    await expect(summary).toContainText('20%')
    await expect(summary).toContainText('3 / 100')
    await expect(summary).toContainText('31/12/2026')
    await expect(page.getByText('Không giới hạn')).toBeVisible()
    const usage = page.getByRole('table').locator('tbody tr')
    await expect(usage).toHaveCount(1)
    await expect(usage.first()).toContainText('E2E-ORD-0001')
    await expect(usage.first()).toContainText('98.000')
    await expect(usage.first()).toContainText('Đã duyệt')
  })

  test('CPN-202 mã không tồn tại: hiện thông báo, nút quay lại về danh sách', async ({ page, api, couponsPage }) => {
    await api.route('/saas/admin/coupons/999', {
      method: 'GET',
      status: 404,
      body: fail('SAAS_004', 'Mã giảm giá không tồn tại.')
    })
    await api.route('/saas/admin/coupons', { method: 'GET', body: ok(pageOf([])) })
    await api.route('/saas/admin/coupons/status-counts', { body: ok(COUPON_COUNTS) })

    await couponsPage.goto('/999')

    await expect(page.getByText('Không tìm thấy mã giảm giá')).toBeVisible()
    await page.getByRole('link', { name: 'Quay lại danh sách mã giảm giá' }).click()
    await expect(page).toHaveURL(/\/dashboard\/coupons(\?|$)/)
  })
})
