// @ts-check
// Feature: plans / Subscription Plans (manual 3.2.3). Spec sources: IAM Swagger /saas/admin/plans (POST, PUT full
// replacement, DELETE soft, PUT /{id}/status), hrm-be SaasDtos.PlanForm validation, messages SAAS_013 / SAAS_015.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok } from '../utils/mock-api.js'
import { PLAN_OLD, PLAN_PRO, PLANS, VND } from './data.js'

test.describe('Gói dịch vụ · quyền', () => {
  test('PLN-001 @smoke người không phải super admin: không có menu và không gọi API gói', async ({
    page,
    api,
    baseURL,
    plansPage
  }) => {
    await api.signIn(String(baseURL), FAKE_ME)
    const planCalls = await api.route('/saas/admin/plans', { body: ok(PLANS) })

    await plansPage.goto()

    await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gói dịch vụ' })).toHaveCount(0)
    expect(planCalls).toHaveLength(0)
  })
})

test.describe('Gói dịch vụ · danh sách gói', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/saas/currencies', { body: ok([VND]) })
  })

  test('PLN-002 @smoke thẻ gói: giá theo tháng/năm, giới hạn, dùng thử, tính năng, gói mặc định đứng đầu', async ({
    page,
    api,
    plansPage
  }) => {
    await api.route('/saas/admin/plans', { method: 'GET', body: ok(PLANS) })

    await plansPage.goto()

    const cards = page.getByRole('article')
    await expect(cards).toHaveCount(3)
    await expect(cards.first()).toHaveAccessibleName('E2E Free')
    const free = plansPage.card('E2E Free')
    await expect(free).toContainText('Mặc định')
    await expect(free).toContainText('Số tài khoản tối đa5')
    const pro = plansPage.card('E2E Pro')
    await expect(pro.getByTestId('plan-price')).toContainText('490.000')
    await expect(pro.getByTestId('plan-price')).toContainText('₫')
    await expect(pro).toContainText('Dùng thử 14 ngày')
    await expect(pro).toContainText('Không giới hạn')
    await expect(pro.getByText('Tích hợp AI')).toBeVisible()

    await plansPage.cycleTab('Theo năm').click()

    await expect(page).toHaveURL(/cycle=YEARLY/)
    await expect(pro).toContainText('Không có giá theo năm')
    await expect(free.getByTestId('plan-price')).toContainText('/ năm')
  })

  test('PLN-003 gói mặc định: không tắt được, không xoá được', async ({ api, plansPage }) => {
    await api.route('/saas/admin/plans', { method: 'GET', body: ok(PLANS) })

    await plansPage.goto()

    const free = plansPage.card('E2E Free')
    await expect(free.getByRole('switch')).toBeDisabled()
    await expect(free.getByRole('button', { name: 'Xoá' })).toBeDisabled()
    await expect(plansPage.card('E2E Pro').getByRole('switch')).toBeEnabled()
  })

  test('PLN-004 bật/tắt gói gửi PUT status đúng giá trị', async ({ api, plansPage }) => {
    await api.route('/saas/admin/plans', { method: 'GET', body: ok(PLANS) })
    const proStatus = await api.route(`/saas/admin/plans/${PLAN_PRO.id}/status`, {
      method: 'PUT',
      body: ok({ ...PLAN_PRO, enabled: false })
    })
    const oldStatus = await api.route(`/saas/admin/plans/${PLAN_OLD.id}/status`, {
      method: 'PUT',
      body: ok({ ...PLAN_OLD, enabled: true })
    })
    await plansPage.goto()

    await plansPage.card('E2E Pro').getByRole('switch').click()
    await expect(plansPage.toast.filter({ hasText: 'Đã tắt gói' })).toBeVisible()
    await plansPage.card('E2E Old').getByRole('switch').click()

    await expect(plansPage.toast.filter({ hasText: 'Đã bật gói' })).toBeVisible()
    expect(proStatus[0].body).toEqual({ enabled: false })
    expect(oldStatus[0].body).toEqual({ enabled: true })
  })

  test('PLN-005 tắt gói mặc định bị backend chặn: hiện message SAAS_015', async ({ api, plansPage }) => {
    // the UI already disables it; this guards the message path if the switch is bypassed
    await api.route('/saas/admin/plans', { method: 'GET', body: ok([{ ...PLAN_PRO, defaultPlan: false }]) })
    await api.route(`/saas/admin/plans/${PLAN_PRO.id}/status`, {
      method: 'PUT',
      status: 400,
      body: fail('SAAS_015', 'Không thể chuyển gói mặc định sang không hoạt động.')
    })
    await plansPage.goto()

    await plansPage.card('E2E Pro').getByRole('switch').click()

    await expect(plansPage.toast).toContainText('Không thể chuyển gói mặc định sang không hoạt động.')
  })

  test('PLN-006 danh sách rỗng', async ({ api, plansPage }) => {
    await api.route('/saas/admin/plans', { method: 'GET', body: ok([]) })

    await plansPage.goto()

    await expect(plansPage.page.getByText('Chưa có gói nào')).toBeVisible()
  })
})

test.describe('Gói dịch vụ · tạo, sửa, xoá', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/saas/currencies', { body: ok([VND]) })
    await api.route('/saas/admin/plans', { method: 'GET', body: ok(PLANS) })
  })

  test('PLN-101 validation: bắt buộc, mã sai định dạng, số âm, số thập phân ở ô số nguyên', async ({
    plansPage,
    api
  }) => {
    const createCalls = await api.route('/saas/admin/plans', { method: 'POST', body: ok(PLAN_PRO) })
    await plansPage.goto()
    await plansPage.addButton.click()

    await plansPage.sheet.getByRole('button', { name: 'Tạo gói' }).click()
    await expect(plansPage.sheet.getByText('Vui lòng nhập thông tin này')).toHaveCount(3)

    await plansPage.field('Mã gói').fill('1abc')
    await plansPage.field('Giá theo tháng').fill('-1')
    await plansPage.field('Số tài khoản tối đa').fill('2.5')
    await plansPage.field('Số nhân viên tối đa').fill('0')
    await plansPage.field('Giá theo năm').fill('abc')

    await expect(
      plansPage.sheet.getByText('Bắt đầu bằng chữ in hoa; chỉ gồm chữ in hoa, số và dấu gạch dưới')
    ).toBeVisible()
    await expect(plansPage.sheet.getByText('Giá trị tối thiểu là 0')).toBeVisible()
    await expect(plansPage.sheet.getByText('Vui lòng nhập số nguyên')).toBeVisible()
    await expect(plansPage.sheet.getByText('Giá trị tối thiểu là 1')).toBeVisible()
    await expect(plansPage.sheet.getByText('Vui lòng nhập số', { exact: true })).toBeVisible()
    expect(createCalls).toHaveLength(0)
  })

  test('PLN-102 @smoke tạo gói: ô trống gửi thiếu (= không giới hạn), dùng thử bật thì cần số ngày', async ({
    api,
    plansPage
  }) => {
    const createCalls = await api.route('/saas/admin/plans', { method: 'POST', body: ok({ ...PLAN_PRO, id: '9' }) })
    await plansPage.goto()
    await plansPage.addButton.click()

    await plansPage.field('Mã gói').fill('E2E_NEW')
    await plansPage.field('Tên gói').fill('  E2E New  ')
    await plansPage.field('Giá theo tháng').fill('199000')
    await plansPage.field('Số tài khoản tối đa').fill('20')
    await plansPage.switchOf('Tích hợp AI').click()
    await plansPage.switchOf('Cho dùng thử').click()
    await plansPage.sheet.getByRole('button', { name: 'Tạo gói' }).click()
    await expect(plansPage.sheet.getByText('Giá trị tối thiểu là 1')).toBeVisible()
    expect(createCalls).toHaveLength(0)

    await plansPage.field('Số ngày dùng thử').fill('7')
    await plansPage.sheet.getByRole('button', { name: 'Tạo gói' }).click()

    await expect(plansPage.toast.filter({ hasText: 'Đã tạo gói' })).toBeVisible()
    expect(createCalls[0].body).toEqual({
      code: 'E2E_NEW',
      name: 'E2E New',
      monthlyPrice: 199000,
      maxUsers: 20,
      trialDays: 7,
      aiIntegration: true,
      defaultPlan: false,
      enabled: true
    })
  })

  test('PLN-103 sửa gói: điền sẵn dữ liệu, xoá giới hạn → bỏ khỏi payload, tắt dùng thử → trialDays 0', async ({
    api,
    plansPage
  }) => {
    const updateCalls = await api.route(`/saas/admin/plans/${PLAN_PRO.id}`, { method: 'PUT', body: ok(PLAN_PRO) })
    await plansPage.goto()

    await plansPage.card('E2E Pro').getByRole('button', { name: 'Sửa' }).click()
    await expect(plansPage.field('Mã gói')).toHaveValue('E2E_PRO')
    await expect(plansPage.field('Giá theo tháng')).toHaveValue('490000')
    await expect(plansPage.field('Số ngày dùng thử')).toHaveValue('14')
    await plansPage.field('Tên gói').fill('E2E Pro Plus')
    await plansPage.switchOf('Cho dùng thử').click()
    await plansPage.sheet.getByRole('button', { name: 'Lưu' }).click()

    await expect(plansPage.toast.filter({ hasText: 'Đã cập nhật gói' })).toBeVisible()
    expect(updateCalls[0].body).toEqual({
      code: 'E2E_PRO',
      name: 'E2E Pro Plus',
      monthlyPrice: 490000,
      trialDays: 0,
      aiIntegration: true,
      defaultPlan: false,
      enabled: true
    })
  })

  test('PLN-104 sửa gói mặc định: công tắc Hoạt động và Gói mặc định bị khoá', async ({ plansPage }) => {
    await plansPage.goto()

    await plansPage.card('E2E Free').getByRole('button', { name: 'Sửa' }).click()

    await expect(plansPage.switchOf('Hoạt động')).toBeDisabled()
    await expect(plansPage.switchOf('Gói mặc định')).toBeDisabled()
    await expect(plansPage.switchOf('Gói mặc định')).toBeChecked()
  })

  test('PLN-105 mã gói trùng: hiện message backend, sheet vẫn mở', async ({ api, plansPage }) => {
    await api.route('/saas/admin/plans', {
      method: 'POST',
      status: 409,
      body: fail('SAAS_002', 'Mã gói đã được sử dụng.')
    })
    await plansPage.goto()
    await plansPage.addButton.click()
    await plansPage.field('Mã gói').fill('E2E_PRO')
    await plansPage.field('Tên gói').fill('Dup')
    await plansPage.field('Giá theo tháng').fill('1')

    await plansPage.sheet.getByRole('button', { name: 'Tạo gói' }).click()

    await expect(plansPage.toast).toContainText('Mã gói đã được sử dụng.')
    await expect(plansPage.field('Mã gói')).toHaveValue('E2E_PRO')
  })

  test('PLN-106 xoá gói: xác nhận rồi gọi DELETE', async ({ api, plansPage }) => {
    const deleteCalls = await api.route(`/saas/admin/plans/${PLAN_OLD.id}`, { method: 'DELETE', body: ok(null) })
    await plansPage.goto()

    await plansPage.card('E2E Old').getByRole('button', { name: 'Xoá' }).click()
    await expect(plansPage.alertDialog).toContainText('gói mặc định hoặc hết hạn')
    await plansPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    await expect(plansPage.toast.filter({ hasText: 'Đã xoá gói' })).toBeVisible()
    expect(deleteCalls).toHaveLength(1)
  })
})
