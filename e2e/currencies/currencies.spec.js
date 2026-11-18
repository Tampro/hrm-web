// @ts-check
// Feature: currencies (manual 3.2.5). Spec sources: hrm-be CurrencyController (GET /saas/admin/currencies keyword +
// paging, GET/PUT/DELETE /{id}, POST), CurrencyService.CurrencyForm validation, messages SAAS_022..SAAS_025.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const VND = {
  id: '1',
  code: 'VND',
  name: 'Việt Nam Đồng',
  symbol: '₫',
  description: null,
  defaultCurrency: true,
  createdDate: '2026-10-01T00:00:00Z',
  updatedDate: '2026-10-01T00:00:00Z'
}
const USD = {
  id: '2',
  code: 'USD',
  name: 'E2E Dollar',
  symbol: '$',
  description: 'E2E test currency',
  defaultCurrency: false,
  createdDate: '2026-11-01T00:00:00Z',
  updatedDate: '2026-11-02T00:00:00Z'
}

test.describe('Tiền tệ · quyền', () => {
  test('CUR-001 @smoke người không phải super admin: không có menu và không gọi API', async ({
    page,
    api,
    baseURL,
    currenciesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_ME)
    const listCalls = await api.route('/saas/admin/currencies', { body: ok(pageOf([VND])) })

    await currenciesPage.goto()

    await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tiền tệ' })).toHaveCount(0)
    expect(listCalls).toHaveLength(0)
  })
})

test.describe('Tiền tệ · danh sách và thao tác', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  })

  test('CUR-002 @smoke danh sách: tên, mã, ký hiệu, Mặc định Có/Không; tiền tệ mặc định không xoá được', async ({
    api,
    currenciesPage
  }) => {
    const listCalls = await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND, USD])) })

    await currenciesPage.goto()

    const vnd = currenciesPage.row('Việt Nam Đồng')
    await expect(vnd).toContainText('VND')
    await expect(vnd).toContainText('₫')
    await expect(vnd).toContainText('Có')
    await expect(vnd.getByRole('button', { name: 'Xoá Việt Nam Đồng' })).toBeDisabled()
    const usd = currenciesPage.row('E2E Dollar')
    await expect(usd).toContainText('Không')
    await expect(usd.getByRole('button', { name: 'Xoá E2E Dollar' })).toBeEnabled()
    expect(listCalls[0].query.get('page')).toBe('0')
  })

  test('CUR-003 tìm kiếm gửi keyword đã trim và giữ sau F5; xoá bộ lọc bỏ keyword', async ({
    page,
    api,
    currenciesPage
  }) => {
    const listCalls = await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([USD])) })
    await currenciesPage.goto()

    await currenciesPage.keyword.fill('  usd ')
    await currenciesPage.searchButton.click()
    await expect.poll(() => listCalls.at(-1)?.query.get('keyword')).toBe('usd')
    await page.reload()
    await expect(currenciesPage.keyword).toHaveValue('usd')

    await currenciesPage.clearButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.has('keyword')).toBe(false)
    await expect(page).not.toHaveURL(/keyword=/)
  })

  test('CUR-004 xem chi tiết', async ({ api, currenciesPage }) => {
    await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND, USD])) })
    await api.route(`/saas/admin/currencies/${USD.id}`, { method: 'GET', body: ok(USD) })
    await currenciesPage.goto()

    await currenciesPage.row('E2E Dollar').getByRole('button', { name: 'Xem E2E Dollar' }).click()

    await expect(currenciesPage.dialog).toContainText('Thông tin tiền tệ')
    await expect(currenciesPage.dialog).toContainText('E2E test currency')
    await expect(currenciesPage.dialog).toContainText('$')
  })

  test('CUR-101 validation: bắt buộc, mã không phải 3 chữ in hoa, ký hiệu quá 10 ký tự', async ({
    api,
    currenciesPage
  }) => {
    await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND])) })
    const createCalls = await api.route('/saas/admin/currencies', { method: 'POST', body: ok(USD) })
    await currenciesPage.goto()
    await currenciesPage.addButton.click()

    await currenciesPage.dialog.getByRole('button', { name: 'Tạo tiền tệ' }).click()
    await expect(currenciesPage.dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(2)

    await currenciesPage.field('Mã tiền tệ').fill('us1')
    await currenciesPage.field('Ký hiệu').fill('x'.repeat(11))

    await expect(currenciesPage.dialog.getByText('Mã ISO 4217 gồm đúng 3 chữ in hoa, ví dụ USD')).toBeVisible()
    await expect(currenciesPage.dialog.getByText('Tối đa 10 ký tự')).toBeVisible()
    expect(createCalls).toHaveLength(0)
  })

  test('CUR-102 @smoke tạo tiền tệ: ô trống bị bỏ khỏi payload, đặt mặc định gửi true', async ({
    api,
    currenciesPage
  }) => {
    await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND])) })
    const createCalls = await api.route('/saas/admin/currencies', { method: 'POST', body: ok(USD) })
    await currenciesPage.goto()
    await currenciesPage.addButton.click()

    await currenciesPage.field('Tên tiền tệ').fill('  E2E Dollar ')
    await currenciesPage.field('Mã tiền tệ').fill('USD')
    await currenciesPage.dialog.getByRole('switch', { name: 'Đặt làm tiền tệ mặc định' }).click()
    await currenciesPage.dialog.getByRole('button', { name: 'Tạo tiền tệ' }).click()

    await expect(currenciesPage.toast.filter({ hasText: 'Đã tạo tiền tệ' })).toBeVisible()
    expect(createCalls[0].body).toEqual({ name: 'E2E Dollar', code: 'USD', defaultCurrency: true })
  })

  test('CUR-103 sửa tiền tệ mặc định: công tắc mặc định bị khoá và vẫn gửi true', async ({ api, currenciesPage }) => {
    await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND, USD])) })
    const updateCalls = await api.route(`/saas/admin/currencies/${VND.id}`, { method: 'PUT', body: ok(VND) })
    await currenciesPage.goto()

    await currenciesPage.row('Việt Nam Đồng').getByRole('button', { name: 'Sửa Việt Nam Đồng' }).click()
    const defaultSwitch = currenciesPage.dialog.getByRole('switch', { name: 'Đặt làm tiền tệ mặc định' })
    await expect(defaultSwitch).toBeDisabled()
    await expect(defaultSwitch).toBeChecked()
    await currenciesPage.field('Mô tả').fill('Đồng Việt Nam')
    await currenciesPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect(currenciesPage.toast.filter({ hasText: 'Đã cập nhật tiền tệ' })).toBeVisible()
    expect(updateCalls[0].body).toEqual({
      name: 'Việt Nam Đồng',
      code: 'VND',
      symbol: '₫',
      description: 'Đồng Việt Nam',
      defaultCurrency: true
    })
  })

  test('CUR-104 mã trùng: hiện message SAAS_023, dialog vẫn mở', async ({ api, currenciesPage }) => {
    await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND])) })
    await api.route('/saas/admin/currencies', {
      method: 'POST',
      status: 400,
      body: fail('SAAS_023', 'Mã tiền tệ đã được sử dụng.')
    })
    await currenciesPage.goto()
    await currenciesPage.addButton.click()
    await currenciesPage.field('Tên tiền tệ').fill('Dup')
    await currenciesPage.field('Mã tiền tệ').fill('VND')

    await currenciesPage.dialog.getByRole('button', { name: 'Tạo tiền tệ' }).click()

    await expect(currenciesPage.toast).toContainText('Mã tiền tệ đã được sử dụng.')
    await expect(currenciesPage.field('Mã tiền tệ')).toHaveValue('VND')
  })

  test('CUR-105 xoá: hộp xác nhận nói rõ xoá vĩnh viễn, gọi DELETE', async ({ api, currenciesPage }) => {
    await api.route('/saas/admin/currencies', { method: 'GET', body: ok(pageOf([VND, USD])) })
    const deleteCalls = await api.route(`/saas/admin/currencies/${USD.id}`, { method: 'DELETE', body: ok(null) })
    await currenciesPage.goto()

    await currenciesPage.row('E2E Dollar').getByRole('button', { name: 'Xoá E2E Dollar' }).click()
    await expect(currenciesPage.alertDialog).toContainText('Xoá vĩnh viễn E2E Dollar (USD)')
    await currenciesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    await expect(currenciesPage.toast.filter({ hasText: 'Đã xoá tiền tệ' })).toBeVisible()
    expect(deleteCalls).toHaveLength(1)
  })
})
