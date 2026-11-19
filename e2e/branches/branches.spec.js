// @ts-check
// Feature: branches (manual 6.2). Spec sources: hrm-be employee-service BranchController, BranchDtos (BranchForm,
// BranchStatusForm), EEmployeeError (EMP_010 in use, EMP_011 name taken, EMP_019 no company).
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ORG_VIEW', 'ORG_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ORG_VIEW'] }

const BRANCH = {
  id: '10',
  companyId: '2',
  name: 'Trụ sở',
  address: 'Tầng 8, 1 Đường E2E',
  city: 'Hà Nội',
  state: null,
  country: 'Việt Nam',
  postalCode: '100000',
  phone: '0240000000',
  email: 'hq@e2e.invalid',
  status: 'ACTIVE',
  createdDate: '2026-11-01T02:00:00Z',
  updatedDate: null,
  departmentCount: null,
  employeeCount: null
}
const NULL_BRANCH = Object.fromEntries(Object.keys(BRANCH).map((k) => [k, k === 'id' ? '11' : null]))

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubList = (api, rows = [BRANCH, NULL_BRANCH]) =>
  api.route('/org/branches', { method: 'GET', body: ok(pageOf(rows)) })

test('BR-001 @smoke không có ORG_VIEW: không có menu, không gọi API', async ({ page, api, baseURL, branchesPage }) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const calls = await stubList(api)

  await branchesPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Chi nhánh' })).toHaveCount(0)
  expect(calls).toHaveLength(0)
})

test.describe('Chi nhánh · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('BR-002 @smoke danh sách: không gửi companyId; tab Tạm nghỉ gửi INACTIVE, Tất cả bỏ status; tìm theo từ khoá', async ({
    page,
    api,
    branchesPage
  }) => {
    const list = await stubList(api)
    await branchesPage.goto()

    await expect(branchesPage.row('Trụ sở')).toContainText('Tầng 8, 1 Đường E2E, Hà Nội, Việt Nam')
    await expect(branchesPage.row('Trụ sở')).toContainText('hq@e2e.invalid')
    await expect(page.getByText('Hiển thị 2 / 2')).toBeVisible()
    expect(list[0].query.has('companyId')).toBe(false)
    expect(list[0].query.has('status')).toBe(false)

    await branchesPage.tab('Tạm nghỉ').click()
    await expect.poll(() => list.at(-1)?.query.get('status')).toBe('INACTIVE')
    await branchesPage.tab('Tất cả').click()
    await expect.poll(() => list.at(-1)?.query.has('status')).toBe(false)

    await branchesPage.keyword.fill('  hq  ')
    await branchesPage.searchButton.click()
    await expect(page).toHaveURL(/keyword=hq/)
    await expect.poll(() => list.at(-1)?.query.get('keyword')).toBe('hq')
  })

  test('BR-003 thêm: tên bắt buộc, email sai bị chặn; POST bỏ ô trống, mặc định ACTIVE', async ({
    api,
    branchesPage
  }) => {
    await stubList(api)
    const posts = await api.route('/org/branches', { method: 'POST', body: ok(BRANCH) })
    await branchesPage.goto()

    await branchesPage.addButton.click()
    await branchesPage.field('Email').fill('not-an-email')
    await branchesPage.dialog.getByRole('button', { name: 'Thêm chi nhánh' }).click()
    await expect(branchesPage.dialog.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    await expect(branchesPage.dialog.getByText('Email không hợp lệ')).toBeVisible()
    expect(posts).toHaveLength(0)

    await branchesPage.field('Tên chi nhánh').fill('  Chi nhánh HCM  ')
    await branchesPage.field('Email').fill('')
    await branchesPage.field('Thành phố').fill('TP.HCM')
    await branchesPage.dialog.getByRole('button', { name: 'Thêm chi nhánh' }).click()

    await expect(branchesPage.toast.filter({ hasText: 'Đã thêm chi nhánh' })).toBeVisible()
    expect(posts[0].body).toEqual({ name: 'Chi nhánh HCM', city: 'TP.HCM', status: 'ACTIVE' })
    expect(posts[0].query.has('companyId')).toBe(false)
  })

  test('BR-004 sửa: điền sẵn; xoá một ô thì không gửi (PUT thay toàn bộ); tắt switch gửi INACTIVE', async ({
    api,
    branchesPage
  }) => {
    await stubList(api)
    const puts = await api.route('/org/branches/10', { method: 'PUT', body: ok(BRANCH) })
    await branchesPage.goto()

    await branchesPage.row('Trụ sở').getByRole('button', { name: 'Sửa Trụ sở' }).click()
    await expect(branchesPage.field('Tên chi nhánh')).toHaveValue('Trụ sở')
    await branchesPage.field('Mã bưu chính').fill('')
    await branchesPage.dialog.getByRole('switch', { name: 'Đang hoạt động' }).click()
    await branchesPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      name: 'Trụ sở',
      address: 'Tầng 8, 1 Đường E2E',
      city: 'Hà Nội',
      country: 'Việt Nam',
      phone: '0240000000',
      email: 'hq@e2e.invalid',
      status: 'INACTIVE'
    })
  })

  test('BR-005 công tắc trạng thái trong bảng gửi PUT /status', async ({ api, branchesPage }) => {
    await stubList(api)
    const status = await api.route('/org/branches/10/status', { method: 'PUT', body: ok(BRANCH) })
    await branchesPage.goto()

    await branchesPage.row('Trụ sở').getByRole('switch', { name: 'Bật / tắt Trụ sở' }).click()

    await expect.poll(() => status[0]?.body).toEqual({ status: 'INACTIVE' })
    await expect(branchesPage.toast.filter({ hasText: 'Đã tạm ngưng chi nhánh' })).toBeVisible()
  })

  test('BR-006 xem: số phòng ban và nhân viên từ GET chi tiết', async ({ page, api, branchesPage }) => {
    await stubList(api)
    await api.route('/org/branches/10', {
      method: 'GET',
      body: ok({ ...BRANCH, departmentCount: 3, employeeCount: 42 })
    })
    await branchesPage.goto()

    await branchesPage.row('Trụ sở').getByRole('button', { name: 'Xem Trụ sở' }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toContainText('Số phòng ban3')
    await expect(sheet).toContainText('Số nhân viên42')
  })

  test('BR-007 xoá khi còn dùng (EMP_010): hiện lỗi, hộp thoại vẫn mở; tên trùng (EMP_011) khi thêm', async ({
    api,
    branchesPage
  }) => {
    await stubList(api)
    await api.route('/org/branches/10', {
      method: 'DELETE',
      status: 400,
      body: fail('EMP_010', 'Đang được sử dụng: e2e-sentinel.')
    })
    await api.route('/org/branches', {
      method: 'POST',
      status: 400,
      body: fail('EMP_011', 'Tên đã tồn tại: e2e-sentinel.')
    })
    await branchesPage.goto()

    await branchesPage.row('Trụ sở').getByRole('button', { name: 'Xoá Trụ sở' }).click()
    await branchesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect(branchesPage.toast).toContainText('Đang được sử dụng: e2e-sentinel.')
    await expect(branchesPage.alertDialog).toBeVisible()
    await branchesPage.alertDialog.getByRole('button', { name: 'Huỷ' }).click()

    await branchesPage.addButton.click()
    await branchesPage.field('Tên chi nhánh').fill('Trụ sở')
    await branchesPage.dialog.getByRole('button', { name: 'Thêm chi nhánh' }).click()
    await expect(branchesPage.toast.filter({ hasText: 'Tên đã tồn tại: e2e-sentinel.' })).toBeVisible()
    await expect(branchesPage.dialog).toBeVisible()
  })
})

test('BR-008 chỉ ORG_VIEW: không có thêm, công tắc, sửa, xoá', async ({ page, api, baseURL, branchesPage }) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubList(api)

  await branchesPage.goto()

  await expect(branchesPage.row('Trụ sở')).toBeVisible()
  await expect(branchesPage.addButton).toHaveCount(0)
  await expect(page.getByRole('switch')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sửa Trụ sở' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Xem Trụ sở' })).toBeVisible()
})

test('BR-009 @smoke super admin: chọn công ty trước (EMP_019); danh sách và thêm mới gửi companyId', async ({
  page,
  api,
  baseURL,
  branchesPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const list = await stubList(api)
  const posts = await api.route('/org/branches', { method: 'POST', body: ok(BRANCH) })

  await branchesPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý chi nhánh.')).toBeVisible()
  await expect(branchesPage.addButton).toHaveCount(0)
  expect(list).toHaveLength(0)

  await branchesPage.choose('Công ty', 'E2E Company (E2ECO)')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')

  await branchesPage.addButton.click()
  await branchesPage.field('Tên chi nhánh').fill('Chi nhánh E2E')
  await branchesPage.dialog.getByRole('button', { name: 'Thêm chi nhánh' }).click()
  await expect.poll(() => posts[0]?.query.get('companyId')).toBe('2')
})

test('BR-010 mở thẳng ?companyId= khi /me trả chậm: URL vẫn giữ công ty và danh sách gửi companyId', async ({
  page,
  api,
  baseURL,
  branchesPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  // registered last = wins over the signIn stub: /me answers after the page has mounted
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const list = await stubList(api)

  await branchesPage.goto('?companyId=2')

  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  await expect(page).toHaveURL(/companyId=2/)
})
