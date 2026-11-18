// @ts-check
// Feature: plans / Plan Requests + Plan Orders (manual 3.2.3). Spec sources: IAM Swagger /saas/admin/plan-requests,
// /saas/admin/orders (+ status-counts, approve, reject, GET /{id}); hrm-be SaasDtos (StatusCountsDto,
// OrderDecisionForm notes ≤ 500, AdminOrderDto); messages SAAS_009 / SAAS_017.
import { expect, test } from '../fixtures/index.js'
import { FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'
import { ORDER_APPROVED, ORDER_PENDING, REQUEST_APPROVED, REQUEST_PENDING, SAAS_COUNTS, VND } from './data.js'

test.beforeEach(async ({ api, baseURL }) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await api.route('/saas/currencies', { body: ok([VND]) })
})

test.describe('Yêu cầu gói', () => {
  test.beforeEach(async ({ api }) => {
    await api.route('/saas/admin/plan-requests/status-counts', { body: ok(SAAS_COUNTS) })
  })

  test('PRQ-001 @smoke danh sách: công ty, gói, chu kỳ, trạng thái; chỉ dòng chờ duyệt có thao tác', async ({
    api,
    saasListPage,
    plansPage
  }) => {
    const listCalls = await api.route('/saas/admin/plan-requests', {
      body: ok(pageOf([REQUEST_PENDING, REQUEST_APPROVED]))
    })

    await plansPage.goto('/requests')

    await expect(plansPage.sectionTab('Yêu cầu gói')).toHaveAttribute('aria-selected', 'true')
    const pending = saasListPage.row('E2E Alpha Co')
    await expect(pending).toContainText('E2E Pro')
    await expect(pending).toContainText('Theo năm')
    await expect(pending).toContainText('Chờ duyệt')
    await expect(pending).toContainText('10/11/2026')
    await expect(pending.getByRole('button', { name: 'Duyệt E2E Alpha Co' })).toBeVisible()
    await expect(saasListPage.row('E2E Beta Co').getByRole('button')).toHaveCount(0)
    await expect(saasListPage.statusTab('Chờ duyệt')).toContainText('1')
    expect(listCalls[0].query.has('status')).toBe(false)
  })

  test('PRQ-002 tab Chờ duyệt gửi status=PENDING, tìm kiếm gửi keyword', async ({
    page,
    api,
    saasListPage,
    plansPage
  }) => {
    const listCalls = await api.route('/saas/admin/plan-requests', { body: ok(pageOf([REQUEST_PENDING])) })
    await plansPage.goto('/requests')

    await saasListPage.statusTab('Chờ duyệt').click()
    await expect(page).toHaveURL(/tab=PENDING/)
    await expect.poll(() => listCalls.at(-1)?.query.get('status')).toBe('PENDING')

    await saasListPage.keyword.fill(' alpha ')
    await saasListPage.searchButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.get('keyword')).toBe('alpha')
    expect(listCalls.at(-1)?.query.get('status')).toBe('PENDING')
  })

  test('PRQ-003 @smoke duyệt kèm ghi chú gửi đúng payload', async ({ api, saasListPage, plansPage }) => {
    await api.route('/saas/admin/plan-requests', { body: ok(pageOf([REQUEST_PENDING])) })
    const approveCalls = await api.route(`/saas/admin/plan-requests/${REQUEST_PENDING.id}/approve`, {
      method: 'POST',
      body: ok({ ...REQUEST_PENDING, status: 'APPROVED' })
    })
    await plansPage.goto('/requests')

    await saasListPage.row('E2E Alpha Co').getByRole('button', { name: 'Duyệt E2E Alpha Co' }).click()
    await saasListPage.dialog.getByLabel('Ghi chú').fill('Welcome aboard')
    await saasListPage.dialog.getByRole('button', { name: 'Duyệt' }).click()

    await expect(saasListPage.toast.filter({ hasText: 'Đã duyệt' })).toBeVisible()
    expect(approveCalls[0].body).toEqual({ notes: 'Welcome aboard' })
  })

  test('PRQ-004 từ chối: lý do quá 500 ký tự bị chặn; để trống thì không gửi notes', async ({
    api,
    saasListPage,
    plansPage
  }) => {
    await api.route('/saas/admin/plan-requests', { body: ok(pageOf([REQUEST_PENDING])) })
    const rejectCalls = await api.route(`/saas/admin/plan-requests/${REQUEST_PENDING.id}/reject`, {
      method: 'POST',
      body: ok({ ...REQUEST_PENDING, status: 'REJECTED' })
    })
    await plansPage.goto('/requests')
    await saasListPage.row('E2E Alpha Co').getByRole('button', { name: 'Từ chối E2E Alpha Co' }).click()

    await saasListPage.dialog.getByLabel('Lý do').fill('x'.repeat(501))
    await expect(saasListPage.dialog.getByText('Tối đa 500 ký tự', { exact: true })).toBeVisible()
    await saasListPage.dialog.getByRole('button', { name: 'Từ chối' }).click()
    expect(rejectCalls).toHaveLength(0)

    await saasListPage.dialog.getByLabel('Lý do').fill('x'.repeat(500))
    await expect(saasListPage.dialog.getByText('Tối đa 500 ký tự', { exact: true })).toHaveCount(0)
    await saasListPage.dialog.getByLabel('Lý do').fill('')
    await saasListPage.dialog.getByRole('button', { name: 'Từ chối' }).click()

    await expect(saasListPage.toast.filter({ hasText: 'Đã từ chối' })).toBeVisible()
    expect(rejectCalls[0].body).toEqual({})
  })

  test('PRQ-005 yêu cầu đã được xử lý ở nơi khác: hiện message SAAS_017', async ({ api, saasListPage, plansPage }) => {
    await api.route('/saas/admin/plan-requests', { body: ok(pageOf([REQUEST_PENDING])) })
    await api.route(`/saas/admin/plan-requests/${REQUEST_PENDING.id}/approve`, {
      method: 'POST',
      status: 409,
      body: fail('SAAS_017', 'Chỉ yêu cầu gói đang chờ mới có thể duyệt, từ chối hoặc hủy.')
    })
    await plansPage.goto('/requests')

    await saasListPage.row('E2E Alpha Co').getByRole('button', { name: 'Duyệt E2E Alpha Co' }).click()
    await saasListPage.dialog.getByRole('button', { name: 'Duyệt' }).click()

    await expect(saasListPage.toast).toContainText('Chỉ yêu cầu gói đang chờ mới có thể duyệt')
    await expect(saasListPage.dialog).toBeVisible()
  })
})

test.describe('Đơn hàng', () => {
  test.beforeEach(async ({ api }) => {
    await api.route('/saas/admin/orders/status-counts', { body: ok(SAAS_COUNTS) })
  })

  test('ORD-001 @smoke danh sách: mã đơn, công ty, giá gốc, giảm giá, thành tiền theo tiền tệ mặc định', async ({
    api,
    saasListPage,
    plansPage
  }) => {
    await api.route('/saas/admin/orders', { body: ok(pageOf([ORDER_PENDING, ORDER_APPROVED])) })

    await plansPage.goto('/orders')

    const pending = saasListPage.row('E2E-ORD-0001')
    await expect(pending).toContainText('E2E Alpha Co')
    await expect(pending).toContainText('490.000')
    await expect(pending).toContainText('49.000')
    await expect(pending).toContainText('441.000')
    await expect(pending).toContainText('₫')
    await expect(pending).toContainText('12/11/2026')
    await expect(pending.getByRole('button', { name: 'Duyệt E2E-ORD-0001' })).toBeVisible()
    const approved = saasListPage.row('E2E-ORD-0002')
    await expect(approved.getByRole('button', { name: 'Xem đơn E2E-ORD-0002' })).toBeVisible()
    await expect(approved.getByRole('button', { name: /Duyệt|Từ chối/ })).toHaveCount(0)
    await expect(saasListPage.showing).toHaveText('Hiển thị 2 / 2')
  })

  test('ORD-002 lọc theo ngày từ URL và xoá bộ lọc', async ({ page, api, saasListPage, plansPage }) => {
    const listCalls = await api.route('/saas/admin/orders', { body: ok(pageOf([ORDER_PENDING])) })
    const countCalls = await api.route('/saas/admin/orders/status-counts', { body: ok(SAAS_COUNTS) })

    await plansPage.goto('/orders', '?dateFrom=2026-11-01&dateTo=2026-11-30')

    await expect.poll(() => listCalls.at(-1)?.query.get('dateFrom')).toBe('2026-11-01')
    expect(listCalls.at(-1)?.query.get('dateTo')).toBe('2026-11-30')
    // list and counts are separate queries fired together: their order is not fixed
    await expect.poll(() => countCalls.at(-1)?.query.get('dateFrom')).toBe('2026-11-01')
    await expect(page.getByLabel('Từ ngày')).toHaveText(/01\/11\/2026/)
    await expect(saasListPage.searchButton).toContainText('2')

    await saasListPage.clearButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.has('dateFrom')).toBe(false)
    await expect(page).not.toHaveURL(/dateFrom/)
  })

  test('ORD-003 xem chi tiết: thông tin đơn và chuyển khoản', async ({ api, saasListPage, plansPage }) => {
    await api.route('/saas/admin/orders', { body: ok(pageOf([ORDER_PENDING])) })
    await api.route(`/saas/admin/orders/${ORDER_PENDING.order.id}`, { body: ok(ORDER_PENDING) })
    await plansPage.goto('/orders')

    await saasListPage.row('E2E-ORD-0001').getByRole('button', { name: 'Xem đơn E2E-ORD-0001' }).click()

    const sheet = saasListPage.dialog
    await expect(sheet).toContainText('Chi tiết đơn hàng')
    await expect(sheet).toContainText('E2E10')
    await expect(sheet).toContainText('Chuyển khoản')
    await expect(sheet).toContainText('Thông tin chuyển khoản')
    await expect(sheet).toContainText('E2E Bank')
  })

  test('ORD-004 @smoke duyệt đơn gửi POST approve với notes', async ({ api, saasListPage, plansPage }) => {
    await api.route('/saas/admin/orders', { body: ok(pageOf([ORDER_PENDING])) })
    const approveCalls = await api.route(`/saas/admin/orders/${ORDER_PENDING.order.id}/approve`, {
      method: 'POST',
      body: ok({ ...ORDER_PENDING.order, status: 'APPROVED' })
    })
    await plansPage.goto('/orders')

    await saasListPage.row('E2E-ORD-0001').getByRole('button', { name: 'Duyệt E2E-ORD-0001' }).click()
    await expect(saasListPage.dialog).toContainText('Duyệt E2E-ORD-0001?')
    await saasListPage.dialog.getByLabel('Ghi chú').fill('Transfer received')
    await saasListPage.dialog.getByRole('button', { name: 'Duyệt' }).click()

    await expect(saasListPage.toast.filter({ hasText: 'Đã duyệt' })).toBeVisible()
    expect(approveCalls[0].body).toEqual({ notes: 'Transfer received' })
  })

  test('ORD-005 dòng thiếu dữ liệu (null) hiển thị "-" và không làm hỏng trang', async ({
    page,
    api,
    saasListPage,
    plansPage
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await api.route('/saas/admin/orders', {
      body: ok(pageOf([{ order: { id: '899', status: null }, companyName: null, companyEmail: null, planName: null }]))
    })

    await plansPage.goto('/orders')

    await expect(saasListPage.rows).toHaveCount(1)
    await expect(saasListPage.rows.first()).not.toContainText('NaN')
    await expect(saasListPage.rows.first().getByRole('cell').first()).toHaveText('-')
    expect(errors).toEqual([])
  })
})
