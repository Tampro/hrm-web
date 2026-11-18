// @ts-check
// Feature: companies / actions (manual 3.2.1). Spec sources: IAM Swagger + hrm-be CompanyDtos.java validation
// (CompanyCreateForm, AdminForm, CompanyUpdateForm, ResetPasswordForm @Size(min = 10), UpgradePlanForm),
// CompanyController (POST, PUT /{id}, PUT /{id}/status, DELETE /{id}, POST /{id}/reset-password, PUT /{id}/plan,
// GET /{id}/info). Temporary password: "returned once in this response".
import { expect, test } from '../fixtures/index.js'
import { FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'
import { COMPANY_ACTIVE, COMPANY_SUSPENDED, COUNTS, INFO_ALPHA, PLANS } from './data.js'

test.beforeEach(async ({ api, baseURL }) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await api.route('/iam/companies/status-counts', { body: ok(COUNTS) })
})

test.describe('Công ty · thêm mới', () => {
  test('CMP-101 bỏ trống và sai định dạng: báo lỗi từng field, không gọi API', async ({ page, api, companiesPage }) => {
    await api.route('/iam/companies', { method: 'GET', body: ok(pageOf([COMPANY_ACTIVE])) })
    const createCalls = await api.route('/iam/companies', { method: 'POST', body: ok({}) })
    await companiesPage.goto()
    await companiesPage.addButton.click()
    const dialog = companiesPage.dialog

    await dialog.getByRole('button', { name: 'Tạo công ty' }).click()
    await expect(dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(6)

    await dialog.getByLabel('Mã công ty').fill('acme-1')
    await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill('not-an-email')
    await dialog.getByLabel('Tên đăng nhập quản trị').fill('ab')

    await expect(dialog.getByText('Chỉ gồm chữ in hoa, số và dấu gạch dưới')).toBeVisible()
    await expect(dialog.getByText('Email không hợp lệ')).toBeVisible()
    await expect(dialog.getByText('Tối thiểu 3 ký tự')).toBeVisible()
    expect(createCalls).toHaveLength(0)
    await expect(page).toHaveURL(/\/dashboard\/companies/)
  })

  test('CMP-102 @smoke tạo công ty: gửi đúng payload, hiện mật khẩu tạm một lần, tải lại danh sách', async ({
    api,
    companiesPage
  }) => {
    const listCalls = await api.route('/iam/companies', { method: 'GET', body: ok(pageOf([COMPANY_ACTIVE])) })
    const createCalls = await api.route('/iam/companies', {
      method: 'POST',
      body: ok({
        company: { ...COMPANY_ACTIVE, id: '200', code: 'E2E_NEW', name: 'E2E New Co' },
        admin: { user: { id: '900', username: 'new.admin' }, temporaryPassword: 'e2e-Temp-Pass-1' }
      })
    })
    await companiesPage.goto()
    await expect(companiesPage.rows).toHaveCount(1)
    const listCallsBefore = listCalls.length
    await companiesPage.addButton.click()
    const dialog = companiesPage.dialog

    await dialog.getByLabel('Mã công ty').fill('E2E_NEW')
    await dialog.getByLabel('Tên công ty').fill('  E2E New Co  ')
    await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill('new@e2e.invalid')
    await dialog.getByRole('switch', { name: 'Cho phép đăng nhập' }).click()
    await dialog.getByLabel('Tên đăng nhập quản trị').fill('new.admin')
    await dialog.getByLabel('Họ tên quản trị').fill('New Admin')
    await dialog.getByLabel('Email quản trị').fill('admin@new.e2e.invalid')
    await dialog.getByRole('button', { name: 'Tạo công ty' }).click()

    await expect(companiesPage.page.getByTestId('temporary-password')).toHaveText('e2e-Temp-Pass-1')
    expect(createCalls).toHaveLength(1)
    expect(createCalls[0].body).toEqual({
      code: 'E2E_NEW',
      name: 'E2E New Co',
      email: 'new@e2e.invalid',
      enableLogin: false,
      admin: { username: 'new.admin', email: 'admin@new.e2e.invalid', fullName: 'New Admin' }
    })
    await expect(companiesPage.toast.filter({ hasText: 'Đã tạo công ty' })).toBeVisible()
    expect(listCalls.length).toBeGreaterThan(listCallsBefore)

    await companiesPage.page.getByRole('button', { name: 'Tôi đã lưu mật khẩu' }).click()
    await expect(companiesPage.page.getByTestId('temporary-password')).toHaveCount(0)
  })

  test('CMP-103 mã công ty đã tồn tại: hiện message backend, dialog vẫn mở để sửa', async ({ api, companiesPage }) => {
    await api.route('/iam/companies', { method: 'GET', body: ok(pageOf([COMPANY_ACTIVE])) })
    await api.route('/iam/companies', {
      method: 'POST',
      status: 409,
      body: fail('IAM_002', 'Mã công ty đã được sử dụng.')
    })
    await companiesPage.goto()
    await companiesPage.addButton.click()
    const dialog = companiesPage.dialog
    await dialog.getByLabel('Mã công ty').fill('E2E_ALPHA')
    await dialog.getByLabel('Tên công ty').fill('Dup')
    await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill('dup@e2e.invalid')
    await dialog.getByLabel('Tên đăng nhập quản trị').fill('dup.admin')
    await dialog.getByLabel('Họ tên quản trị').fill('Dup Admin')
    await dialog.getByLabel('Email quản trị').fill('dup.admin@e2e.invalid')

    await dialog.getByRole('button', { name: 'Tạo công ty' }).click()

    await expect(companiesPage.toast).toContainText('Mã công ty đã được sử dụng.')
    await expect(dialog.getByLabel('Mã công ty')).toHaveValue('E2E_ALPHA')
    await expect(companiesPage.page.getByTestId('temporary-password')).toHaveCount(0)
  })
})

test.describe('Công ty · thao tác trên dòng', () => {
  test.beforeEach(async ({ api }) => {
    await api.route('/iam/companies', { method: 'GET', body: ok(pageOf([COMPANY_ACTIVE, COMPANY_SUSPENDED])) })
  })

  test('CMP-201 sửa: mã công ty bị khoá, gửi PUT name + email', async ({ api, companiesPage }) => {
    const updateCalls = await api.route(`/iam/companies/${COMPANY_ACTIVE.id}`, {
      method: 'PUT',
      body: ok({ ...COMPANY_ACTIVE, name: 'E2E Alpha Renamed' })
    })
    await companiesPage.goto()

    await companiesPage.rowAction('E2E Alpha Co', 'Sửa')
    const dialog = companiesPage.dialog
    await expect(dialog.getByLabel('Mã công ty')).toBeDisabled()
    await expect(dialog.getByLabel('Mã công ty')).toHaveValue('E2E_ALPHA')
    await dialog.getByLabel('Tên công ty').fill('E2E Alpha Renamed')
    await dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect(companiesPage.toast.filter({ hasText: 'Đã cập nhật công ty' })).toBeVisible()
    expect(updateCalls[0].body).toEqual({ name: 'E2E Alpha Renamed', email: 'alpha@e2e.invalid' })
    await expect(dialog).toHaveCount(0)
  })

  test('CMP-202 khoá đăng nhập: có bước xác nhận, huỷ thì không gọi API, xác nhận gửi SUSPENDED', async ({
    api,
    companiesPage
  }) => {
    const statusCalls = await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/status`, {
      method: 'PUT',
      body: ok({ ...COMPANY_ACTIVE, status: 'SUSPENDED' })
    })
    await companiesPage.goto()

    await companiesPage.rowAction('E2E Alpha Co', 'Khoá đăng nhập')
    await expect(companiesPage.alertDialog).toContainText('E2E Alpha Co')
    await companiesPage.alertDialog.getByRole('button', { name: 'Huỷ' }).click()
    expect(statusCalls).toHaveLength(0)

    await companiesPage.rowAction('E2E Alpha Co', 'Khoá đăng nhập')
    await companiesPage.alertDialog.getByRole('button', { name: 'Khoá đăng nhập' }).click()

    await expect(companiesPage.toast.filter({ hasText: 'Đã khoá đăng nhập' })).toBeVisible()
    expect(statusCalls[0].body).toEqual({ status: 'SUSPENDED' })
  })

  test('CMP-203 công ty đang tạm khoá có thao tác Mở đăng nhập và gửi ACTIVE', async ({ api, companiesPage }) => {
    const statusCalls = await api.route(`/iam/companies/${COMPANY_SUSPENDED.id}/status`, {
      method: 'PUT',
      body: ok({ ...COMPANY_SUSPENDED, status: 'ACTIVE' })
    })
    await companiesPage.goto()

    await companiesPage.rowAction('E2E Beta Co', 'Mở đăng nhập')
    await companiesPage.alertDialog.getByRole('button', { name: 'Mở đăng nhập' }).click()

    await expect(companiesPage.toast.filter({ hasText: 'Đã mở đăng nhập' })).toBeVisible()
    expect(statusCalls[0].body).toEqual({ status: 'ACTIVE' })
  })

  test('CMP-204 xoá: xác nhận rồi gọi DELETE đúng id', async ({ api, companiesPage }) => {
    const deleteCalls = await api.route(`/iam/companies/${COMPANY_SUSPENDED.id}`, {
      method: 'DELETE',
      body: ok(null)
    })
    await companiesPage.goto()

    await companiesPage.rowAction('E2E Beta Co', 'Xoá')
    await expect(companiesPage.alertDialog).toContainText('Không thể hoàn tác')
    await companiesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    await expect(companiesPage.toast.filter({ hasText: 'Đã xoá công ty' })).toBeVisible()
    expect(deleteCalls).toHaveLength(1)
    await expect(companiesPage.alertDialog).toHaveCount(0)
  })

  test('CMP-205 thông tin công ty: số tài khoản / giới hạn và danh sách quản trị viên', async ({
    api,
    companiesPage
  }) => {
    await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/info`, { body: ok(INFO_ALPHA) })
    await companiesPage.goto()

    await companiesPage.rowAction('E2E Alpha Co', 'Thông tin công ty')
    const sheet = companiesPage.dialog

    await expect(sheet).toContainText('7 / 50')
    await expect(sheet).toContainText('31/01/2027')
    await expect(sheet).toContainText('Alpha Admin')
    await expect(sheet.getByText('alpha.ops', { exact: false })).toBeVisible()
    await expect(sheet).toContainText('Đã khoá')
  })

  test('CMP-206 đặt lại mật khẩu: tối thiểu 10 ký tự; mặc định không gửi userId', async ({ api, companiesPage }) => {
    await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/info`, { body: ok(INFO_ALPHA) })
    const resetCalls = await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/reset-password`, {
      method: 'POST',
      body: ok({ id: '501', username: 'alpha.admin' })
    })
    await companiesPage.goto()
    await companiesPage.rowAction('E2E Alpha Co', 'Đặt lại mật khẩu')
    const dialog = companiesPage.dialog

    await dialog.getByLabel('Mật khẩu mới').fill('123456789')
    await expect(dialog.getByText('Tối thiểu 10 ký tự')).toBeVisible()
    await dialog.getByRole('button', { name: 'Lưu' }).click()
    expect(resetCalls).toHaveLength(0)

    await dialog.getByLabel('Mật khẩu mới').fill('1234567890')
    await expect(dialog.getByText('Tối thiểu 10 ký tự')).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect(companiesPage.toast.filter({ hasText: 'Đã đặt lại mật khẩu cho alpha.admin' })).toBeVisible()
    expect(resetCalls[0].body).toEqual({ newPassword: '1234567890' })
  })

  test('CMP-207 đặt lại mật khẩu cho tài khoản được chọn gửi userId dạng số', async ({ api, companiesPage }) => {
    await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/info`, { body: ok(INFO_ALPHA) })
    const resetCalls = await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/reset-password`, {
      method: 'POST',
      body: ok({ id: '502', username: 'alpha.ops' })
    })
    await companiesPage.goto()
    await companiesPage.rowAction('E2E Alpha Co', 'Đặt lại mật khẩu')
    const dialog = companiesPage.dialog

    await dialog.getByLabel('Tài khoản').click()
    await companiesPage.page.getByRole('option', { name: 'Alpha Ops (alpha.ops)' }).click()
    await dialog.getByLabel('Mật khẩu mới').fill('a-new-password-1')
    await dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => resetCalls.length).toBe(1)
    expect(resetCalls[0].body).toEqual({ userId: 502, newPassword: 'a-new-password-1' })
  })

  test('CMP-208 nâng cấp gói: chỉ gói đang bật, chọn gói + theo năm gửi planId số và YEARLY', async ({
    api,
    companiesPage
  }) => {
    await api.route('/saas/admin/plans', { body: ok(PLANS) })
    const planCalls = await api.route(`/iam/companies/${COMPANY_ACTIVE.id}/plan`, { method: 'PUT', body: ok({}) })
    await companiesPage.goto()

    await companiesPage.rowAction('E2E Alpha Co', 'Nâng cấp gói')
    const dialog = companiesPage.dialog
    await expect(dialog.getByRole('radio')).toHaveCount(3)
    await expect(dialog.getByRole('radio', { name: /Pro/ })).toHaveAttribute('aria-checked', 'true')
    await expect(dialog).not.toContainText('Legacy Disabled')

    await dialog.getByRole('tab', { name: 'Theo năm' }).click()
    await expect(dialog.getByRole('radio', { name: /Enterprise/ })).toContainText('990 / năm')
    await dialog.getByRole('radio', { name: /Enterprise/ }).click()
    await dialog.getByRole('button', { name: 'Nâng cấp' }).click()

    await expect(companiesPage.toast.filter({ hasText: 'Đã nâng cấp gói' })).toBeVisible()
    expect(planCalls[0].body).toEqual({ planId: 3, billingCycle: 'YEARLY' })
  })
})
