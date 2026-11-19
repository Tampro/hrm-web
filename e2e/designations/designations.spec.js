// @ts-check
// Feature: designations (manual 6.4). Spec sources: hrm-be employee-service DesignationController, DesignationDtos
// (DesignationForm), department / branch options, EEmployeeError EMP_010 / EMP_011 / EMP_019.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ORG_VIEW', 'ORG_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ORG_VIEW'] }

const BRANCHES = [
  { id: '10', name: 'Trụ sở' },
  { id: '11', name: 'Chi nhánh HCM' }
]
// the same department name in two branches: the picker must tell them apart
const DEPARTMENTS = [
  { id: '20', name: 'Kỹ thuật', branchId: '10' },
  { id: '21', name: 'Kỹ thuật', branchId: '11' }
]
const DESIGNATION = {
  id: '30',
  companyId: '2',
  name: 'Kỹ sư phần mềm',
  description: 'Phát triển backend',
  department: { id: '20', name: 'Kỹ thuật' },
  branch: { id: '10', name: 'Trụ sở' },
  status: 'ACTIVE',
  createdDate: '2026-11-01T02:00:00Z',
  updatedDate: null,
  employeeCount: null
}
const NULL_DESIGNATION = Object.fromEntries(Object.keys(DESIGNATION).map((k) => [k, k === 'id' ? '31' : null]))

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubPage = async (api, rows = [DESIGNATION, NULL_DESIGNATION]) => {
  const list = await api.route('/org/designations', { method: 'GET', body: ok(pageOf(rows)) })
  const departments = await api.route('/org/departments/options', { body: ok(DEPARTMENTS) })
  await api.route('/org/branches/options', { body: ok(BRANCHES) })
  return { list, departments }
}

test('DES-001 @smoke không có ORG_VIEW: không có menu, không gọi API', async ({
  page,
  api,
  baseURL,
  designationsPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { list } = await stubPage(api)

  await designationsPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Chức danh' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Chức danh · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('DES-002 @smoke danh sách: phòng ban và chi nhánh mỗi dòng; lọc phòng ban (tên kèm chi nhánh); tab trạng thái', async ({
    page,
    api,
    designationsPage
  }) => {
    const { list, departments } = await stubPage(api)
    await designationsPage.goto()

    await expect(designationsPage.row('Kỹ sư phần mềm')).toContainText('Kỹ thuật')
    await expect(designationsPage.row('Kỹ sư phần mềm')).toContainText('Trụ sở')
    await expect(page.getByText('Hiển thị 2 / 2')).toBeVisible()
    expect(list[0].query.has('companyId')).toBe(false)
    // every department of the company, not one branch
    expect(departments[0].query.has('branchId')).toBe(false)

    await designationsPage.choose('Phòng ban', 'Kỹ thuật · Chi nhánh HCM')
    await designationsPage.keyword.fill('  kỹ sư  ')
    await designationsPage.searchButton.click()
    await expect.poll(() => list.at(-1)?.query.get('departmentId')).toBe('21')
    expect(list.at(-1)?.query.get('keyword')).toBe('kỹ sư')

    await designationsPage.tab('Tạm nghỉ').click()
    await expect.poll(() => list.at(-1)?.query.get('status')).toBe('INACTIVE')
    await designationsPage.tab('Tất cả').click()
    await expect.poll(() => list.at(-1)?.query.has('status')).toBe(false)
  })

  test('DES-003 xem: số nhân viên từ GET chi tiết', async ({ page, api, designationsPage }) => {
    await stubPage(api)
    await api.route('/org/designations/30', { method: 'GET', body: ok({ ...DESIGNATION, employeeCount: 12 }) })
    await designationsPage.goto()

    await designationsPage.row('Kỹ sư phần mềm').getByRole('button', { name: 'Xem Kỹ sư phần mềm' }).click()

    await expect(page.getByRole('dialog')).toContainText('Số nhân viên12')
    await expect(page.getByRole('dialog')).toContainText('Chi nhánhTrụ sở')
  })

  test('DES-004 thêm: tên và phòng ban bắt buộc; POST gửi departmentId số, bỏ mô tả trống, mặc định ACTIVE', async ({
    api,
    designationsPage
  }) => {
    await stubPage(api)
    const posts = await api.route('/org/designations', { method: 'POST', body: ok(DESIGNATION) })
    await designationsPage.goto()

    await designationsPage.addButton.click()
    await designationsPage.dialog.getByRole('button', { name: 'Tạo chức danh' }).click()
    await expect(designationsPage.dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(2)
    expect(posts).toHaveLength(0)

    await designationsPage.field('Tên chức danh').fill('  Trưởng nhóm  ')
    await designationsPage.choose('Phòng ban', 'Kỹ thuật · Chi nhánh HCM', designationsPage.dialog)
    await designationsPage.dialog.getByRole('button', { name: 'Tạo chức danh' }).click()

    await expect(designationsPage.toast.filter({ hasText: 'Đã tạo chức danh' })).toBeVisible()
    expect(posts[0].body).toEqual({ name: 'Trưởng nhóm', departmentId: 21, status: 'ACTIVE' })
  })

  test('DES-005 sửa: phòng ban đã tạm ngưng vẫn hiện; xoá mô tả thì không gửi; tắt gửi INACTIVE', async ({
    api,
    designationsPage
  }) => {
    await stubPage(api, [
      { ...DESIGNATION, department: { id: '99', name: 'Phòng cũ' }, branch: { id: '10', name: 'Trụ sở' } }
    ])
    const puts = await api.route('/org/designations/30', { method: 'PUT', body: ok(DESIGNATION) })
    await designationsPage.goto()

    await designationsPage.row('Kỹ sư phần mềm').getByRole('button', { name: 'Sửa Kỹ sư phần mềm' }).click()
    await expect(designationsPage.field('Tên chức danh')).toHaveValue('Kỹ sư phần mềm')
    await expect(designationsPage.dialog.getByRole('combobox', { name: 'Phòng ban' })).toContainText(
      'Phòng cũ · Trụ sở'
    )
    await designationsPage.field('Mô tả').fill('')
    await designationsPage.dialog.getByRole('switch', { name: 'Đang hoạt động' }).click()
    await designationsPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ name: 'Kỹ sư phần mềm', departmentId: 99, status: 'INACTIVE' })
  })

  test('DES-006 công tắc gửi PUT /status; xoá khi còn nhân viên (EMP_010) hiện lỗi; tên trùng (EMP_011)', async ({
    api,
    designationsPage
  }) => {
    await stubPage(api)
    const status = await api.route('/org/designations/30/status', { method: 'PUT', body: ok(DESIGNATION) })
    await api.route('/org/designations/30', {
      method: 'DELETE',
      status: 400,
      body: fail('EMP_010', 'Đang được sử dụng: e2e-sentinel.')
    })
    await api.route('/org/designations', {
      method: 'POST',
      status: 400,
      body: fail('EMP_011', 'Tên đã tồn tại: e2e-sentinel.')
    })
    await designationsPage.goto()

    await designationsPage.row('Kỹ sư phần mềm').getByRole('switch', { name: 'Bật / tắt Kỹ sư phần mềm' }).click()
    await expect.poll(() => status[0]?.body).toEqual({ status: 'INACTIVE' })

    await designationsPage.row('Kỹ sư phần mềm').getByRole('button', { name: 'Xoá Kỹ sư phần mềm' }).click()
    await designationsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect(designationsPage.toast.filter({ hasText: 'Đang được sử dụng: e2e-sentinel.' })).toBeVisible()
    await expect(designationsPage.alertDialog).toBeVisible()
    await designationsPage.alertDialog.getByRole('button', { name: 'Huỷ' }).click()

    await designationsPage.addButton.click()
    await designationsPage.field('Tên chức danh').fill('Kỹ sư phần mềm')
    await designationsPage.choose('Phòng ban', 'Kỹ thuật · Trụ sở', designationsPage.dialog)
    await designationsPage.dialog.getByRole('button', { name: 'Tạo chức danh' }).click()
    await expect(designationsPage.toast.filter({ hasText: 'Tên đã tồn tại: e2e-sentinel.' })).toBeVisible()
    await expect(designationsPage.dialog).toBeVisible()
  })
})

test('DES-007 chỉ ORG_VIEW: không có thêm, công tắc, sửa, xoá', async ({ page, api, baseURL, designationsPage }) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubPage(api)

  await designationsPage.goto()

  await expect(designationsPage.row('Kỹ sư phần mềm')).toBeVisible()
  await expect(designationsPage.addButton).toHaveCount(0)
  await expect(page.getByRole('switch')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Sửa/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Xem Kỹ sư phần mềm' })).toBeVisible()
})

test('DES-008 @smoke super admin: chọn công ty trước; ?companyId= giữ được khi /me chậm; thêm gửi companyId', async ({
  page,
  api,
  baseURL,
  designationsPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const { list, departments } = await stubPage(api)
  const posts = await api.route('/org/designations', { method: 'POST', body: ok(DESIGNATION) })

  await designationsPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý chức danh.')).toBeVisible()
  expect(list).toHaveLength(0)

  await designationsPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  await expect(page).toHaveURL(/companyId=2/)
  expect(departments.at(-1)?.query.get('companyId')).toBe('2')

  await designationsPage.addButton.click()
  await designationsPage.field('Tên chức danh').fill('Chức danh E2E')
  await designationsPage.choose('Phòng ban', 'Kỹ thuật · Trụ sở', designationsPage.dialog)
  await designationsPage.dialog.getByRole('button', { name: 'Tạo chức danh' }).click()
  await expect.poll(() => posts[0]?.query.get('companyId')).toBe('2')
})
