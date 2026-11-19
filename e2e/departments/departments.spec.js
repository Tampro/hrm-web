// @ts-check
// Feature: departments (manual 6.3, design CmsPhongBan / CmsPhongBanThem). Spec sources: hrm-be employee-service
// DepartmentController, DepartmentDtos (DepartmentForm, StatusCounts), EEmployeeError EMP_010 / EMP_011 / EMP_019.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ORG_VIEW', 'ORG_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ORG_VIEW'] }

const BRANCHES = [
  { id: '10', name: 'Trụ sở' },
  { id: '11', name: 'Chi nhánh HCM' }
]
const DEPARTMENT = {
  id: '20',
  companyId: '2',
  name: 'Kỹ thuật',
  description: 'Phát triển sản phẩm',
  branch: { id: '10', name: 'Trụ sở' },
  status: 'ACTIVE',
  createdDate: '2021-03-01T02:00:00Z',
  updatedDate: null,
  designationCount: null,
  employeeCount: null
}
const NULL_DEPARTMENT = Object.fromEntries(Object.keys(DEPARTMENT).map((k) => [k, k === 'id' ? '21' : null]))

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubPage = async (api, rows = [DEPARTMENT, NULL_DEPARTMENT]) => {
  const list = await api.route('/org/departments', { method: 'GET', body: ok(pageOf(rows)) })
  const counts = await api.route('/org/departments/status-counts', { body: ok({ all: 6, active: 5, inactive: 1 }) })
  await api.route('/org/branches/options', { body: ok(BRANCHES) })
  return { list, counts }
}

test('DEP-001 @smoke không có ORG_VIEW: không có menu, không gọi API', async ({
  page,
  api,
  baseURL,
  departmentsPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { list } = await stubPage(api)

  await departmentsPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Phòng ban' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Phòng ban · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('DEP-002 @smoke danh sách: tab đếm theo status-counts; lọc chi nhánh gửi cả danh sách và số đếm', async ({
    page,
    api,
    departmentsPage
  }) => {
    const { list, counts } = await stubPage(api)
    await departmentsPage.goto()

    await expect(departmentsPage.row('Kỹ thuật')).toContainText('Trụ sở')
    await expect(departmentsPage.tab('Tạm nghỉ')).toContainText('1')
    await expect(page.getByText('Hiển thị 2 / 2')).toBeVisible()
    expect(list[0].query.has('companyId')).toBe(false)

    await departmentsPage.choose('Chi nhánh', 'Chi nhánh HCM')
    await departmentsPage.keyword.fill('  ky  ')
    await departmentsPage.searchButton.click()
    await expect.poll(() => list.at(-1)?.query.get('branchId')).toBe('11')
    expect(list.at(-1)?.query.get('keyword')).toBe('ky')
    await expect.poll(() => counts.at(-1)?.query.get('branchId')).toBe('11')
    // counts take the same filters as the list but never the status tab
    expect(counts.at(-1)?.query.has('status')).toBe(false)

    await departmentsPage.tab('Tạm nghỉ').click()
    await expect.poll(() => list.at(-1)?.query.get('status')).toBe('INACTIVE')
    await departmentsPage.tab('Tất cả').click()
    await expect.poll(() => list.at(-1)?.query.has('status')).toBe(false)
  })

  test('DEP-003 bấm tên: khung "Phòng ban đang chọn" hiện số chức danh và nhân sự', async ({
    api,
    departmentsPage
  }) => {
    await stubPage(api)
    await api.route('/org/departments/20', {
      method: 'GET',
      body: ok({ ...DEPARTMENT, designationCount: 4, employeeCount: 86 })
    })
    await departmentsPage.goto()
    await expect(departmentsPage.panel).toContainText('Bấm tên một phòng ban để xem chi tiết.')

    await departmentsPage.page.getByRole('button', { name: 'Xem phòng ban Kỹ thuật' }).click()

    await expect(departmentsPage.panel).toContainText('Kỹ thuật')
    await expect(departmentsPage.panel).toContainText('Số chức danh4')
    await expect(departmentsPage.panel).toContainText('Nhân sự86')
    await expect(departmentsPage.panel.getByRole('button', { name: 'Sửa phòng ban' })).toBeVisible()
  })

  test('DEP-004 thêm: tên và chi nhánh bắt buộc; POST gửi branchId số, bỏ mô tả trống, mặc định ACTIVE', async ({
    api,
    departmentsPage
  }) => {
    await stubPage(api)
    const posts = await api.route('/org/departments', { method: 'POST', body: ok(DEPARTMENT) })
    await departmentsPage.goto()

    await departmentsPage.addButton.click()
    await departmentsPage.dialog.getByRole('button', { name: 'Tạo phòng ban' }).click()
    await expect(departmentsPage.dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(2)
    expect(posts).toHaveLength(0)

    await departmentsPage.field('Tên phòng ban').fill('  Chăm sóc khách hàng  ')
    await departmentsPage.choose('Chi nhánh', 'Chi nhánh HCM', departmentsPage.dialog)
    await departmentsPage.dialog.getByRole('button', { name: 'Tạo phòng ban' }).click()

    await expect(departmentsPage.toast.filter({ hasText: 'Đã tạo phòng ban' })).toBeVisible()
    expect(posts[0].body).toEqual({ name: 'Chăm sóc khách hàng', branchId: 11, status: 'ACTIVE' })
  })

  test('DEP-005 sửa: điền sẵn; chi nhánh đã tạm ngưng vẫn hiện; xoá mô tả thì không gửi; tắt gửi INACTIVE', async ({
    api,
    departmentsPage
  }) => {
    // the saved branch is no longer in the active options
    await stubPage(api, [{ ...DEPARTMENT, branch: { id: '99', name: 'Chi nhánh cũ' } }])
    const puts = await api.route('/org/departments/20', { method: 'PUT', body: ok(DEPARTMENT) })
    await departmentsPage.goto()

    await departmentsPage.row('Kỹ thuật').getByRole('button', { name: 'Sửa Kỹ thuật' }).click()
    await expect(departmentsPage.field('Tên phòng ban')).toHaveValue('Kỹ thuật')
    await expect(departmentsPage.dialog.getByRole('combobox', { name: 'Chi nhánh' })).toContainText('Chi nhánh cũ')
    await departmentsPage.field('Mô tả chức năng').fill('')
    await departmentsPage.dialog.getByRole('switch', { name: 'Đang hoạt động' }).click()
    await departmentsPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ name: 'Kỹ thuật', branchId: 99, status: 'INACTIVE' })
  })

  test('DEP-006 công tắc trạng thái gửi PUT /status', async ({ api, departmentsPage }) => {
    await stubPage(api)
    const status = await api.route('/org/departments/20/status', { method: 'PUT', body: ok(DEPARTMENT) })
    await departmentsPage.goto()

    await departmentsPage.row('Kỹ thuật').getByRole('switch', { name: 'Bật / tắt Kỹ thuật' }).click()

    await expect.poll(() => status[0]?.body).toEqual({ status: 'INACTIVE' })
  })

  test('DEP-007 xoá khi còn dùng (EMP_010) hiện lỗi; tên trùng trong chi nhánh (EMP_011) khi thêm', async ({
    api,
    departmentsPage
  }) => {
    await stubPage(api)
    await api.route('/org/departments/20', {
      method: 'DELETE',
      status: 400,
      body: fail('EMP_010', 'Đang được sử dụng: e2e-sentinel.')
    })
    await api.route('/org/departments', {
      method: 'POST',
      status: 400,
      body: fail('EMP_011', 'Tên đã tồn tại: e2e-sentinel.')
    })
    await departmentsPage.goto()

    await departmentsPage.row('Kỹ thuật').getByRole('button', { name: 'Xoá Kỹ thuật' }).click()
    await expect(departmentsPage.alertDialog).toContainText('Xoá phòng ban Kỹ thuật?')
    await departmentsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect(departmentsPage.toast.filter({ hasText: 'Đang được sử dụng: e2e-sentinel.' })).toBeVisible()
    await expect(departmentsPage.alertDialog).toBeVisible()
    await departmentsPage.alertDialog.getByRole('button', { name: 'Huỷ' }).click()

    await departmentsPage.addButton.click()
    await departmentsPage.field('Tên phòng ban').fill('Kỹ thuật')
    await departmentsPage.choose('Chi nhánh', 'Trụ sở', departmentsPage.dialog)
    await departmentsPage.dialog.getByRole('button', { name: 'Tạo phòng ban' }).click()
    await expect(departmentsPage.toast.filter({ hasText: 'Tên đã tồn tại: e2e-sentinel.' })).toBeVisible()
    await expect(departmentsPage.dialog).toBeVisible()
  })
})

test('DEP-008 chỉ ORG_VIEW: không có thêm, công tắc, sửa, xoá', async ({ page, api, baseURL, departmentsPage }) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubPage(api)
  await api.route('/org/departments/20', { method: 'GET', body: ok(DEPARTMENT) })

  await departmentsPage.goto()
  await page.getByRole('button', { name: 'Xem phòng ban Kỹ thuật' }).click()

  await expect(departmentsPage.panel).toContainText('Kỹ thuật')
  await expect(departmentsPage.addButton).toHaveCount(0)
  await expect(page.getByRole('switch')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Sửa/ })).toHaveCount(0)
})

test('DEP-009 @smoke super admin: chọn công ty trước; mở thẳng ?companyId= khi /me chậm vẫn giữ công ty', async ({
  page,
  api,
  baseURL,
  departmentsPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const { list } = await stubPage(api)
  const posts = await api.route('/org/departments', { method: 'POST', body: ok(DEPARTMENT) })

  await departmentsPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý phòng ban.')).toBeVisible()
  expect(list).toHaveLength(0)

  await departmentsPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  await expect(page).toHaveURL(/companyId=2/)

  await departmentsPage.addButton.click()
  await departmentsPage.field('Tên phòng ban').fill('Phòng E2E')
  await departmentsPage.choose('Chi nhánh', 'Trụ sở', departmentsPage.dialog)
  await departmentsPage.dialog.getByRole('button', { name: 'Tạo phòng ban' }).click()
  await expect.poll(() => posts[0]?.query.get('companyId')).toBe('2')
})
