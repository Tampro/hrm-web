// @ts-check
// Feature: employees (manual 6.1). Spec sources: hrm-be employee-service EmployeeController, EmployeeFileController,
// EmployeeDtos (ProfileForm, EmployeeCreateForm, PasswordForm), OrgController options, media-service upload,
// EEmployeeError (EMP_007, EMP_019). Design: CmsNhanVien, CmsNhanVienChiTiet, CmsThemNhanVien 1–4.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'
import {
  BRANCHES,
  COMPANY,
  COUNTS,
  DEPARTMENTS,
  DESIGNATIONS,
  DETAIL,
  DOCUMENT,
  DOCUMENT_TYPES,
  NULL_ROW,
  ROW
} from './data.js'

const HR = {
  ...FAKE_ME,
  permissions: ['EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE', 'EMPLOYEE_BANKING_VIEW']
}

/**
 * List page stubs (company user or super admin).
 * @param {ReturnType<import('../utils/mock-api.js').mockApi>} api
 * @param {unknown[]} [rows]
 */
const stubList = async (api, rows = [ROW]) => {
  const list = await api.route('/employees', { method: 'GET', body: ok(pageOf(rows, { totalElements: 7 })) })
  const counts = await api.route('/employees/status-counts', { body: ok(COUNTS) })
  await api.route('/org/branches/options', { body: ok(BRANCHES) })
  const departments = await api.route('/org/departments/options', { body: ok(DEPARTMENTS) })
  await api.route('/org/designations/options', { body: ok(DESIGNATIONS) })
  return { list, counts, departments }
}

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubWizardOptions = async (api) => {
  await api.route('/org/branches/options', { body: ok(BRANCHES) })
  await api.route('/org/departments/options', { body: ok(DEPARTMENTS) })
  await api.route('/org/designations/options', { body: ok(DESIGNATIONS) })
  await api.route('/org/document-types/options', { body: ok(DOCUMENT_TYPES) })
  await api.route('/employees', {
    method: 'GET',
    body: ok(pageOf([{ ...ROW, id: '138', fullName: 'Trần Quốc Hưng', employeeNo: 'NV0138' }]))
  })
  await api.route('/iam/companies', { body: ok(pageOf([COMPANY])) })
}

test('EMP-001 @smoke không có EMPLOYEE_VIEW: không có menu, không gọi API nhân viên', async ({
  page,
  api,
  baseURL,
  employeesPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const calls = await api.route('/employees', { body: ok(pageOf([ROW])) })

  await employeesPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hồ sơ nhân viên' })).toHaveCount(0)
  expect(calls).toHaveLength(0)
})

test.describe('Nhân viên · người dùng công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), HR)
  })

  test('EMP-002 @smoke danh sách: không có chọn công ty, không gửi companyId; tab đếm theo status-counts', async ({
    page,
    api,
    employeesPage
  }) => {
    const { list, counts } = await stubList(api, [ROW, NULL_ROW])

    await employeesPage.goto()

    await expect(page.getByRole('cell', { name: /Nguyễn Minh Thư/ })).toBeVisible()
    await expect(page.getByText('Hiển thị 2 / 7')).toBeVisible()
    await expect(employeesPage.companyPicker).toHaveCount(0)
    await expect(employeesPage.tab('Thử việc')).toContainText('2')
    expect(list[0].query.has('companyId')).toBe(false)
    expect(list[0].query.has('status')).toBe(false)
    expect(counts[0].query.has('companyId')).toBe(false)
    // all-null row: no crash, placeholders shown
    await expect(page.getByRole('row').nth(2)).toContainText('-')
  })

  test('EMP-003 tab Thử việc gửi status=PROBATION; Tất cả bỏ status (BE không nhận ALL)', async ({
    page,
    api,
    employeesPage
  }) => {
    const { list } = await stubList(api)
    await employeesPage.goto()

    await employeesPage.tab('Thử việc').click()
    await expect(page).toHaveURL(/tab=PROBATION/)
    await expect.poll(() => list.at(-1)?.query.get('status')).toBe('PROBATION')

    await employeesPage.tab('Tất cả').click()
    await expect.poll(() => list.at(-1)?.query.has('status')).toBe(false)
  })

  test('EMP-004 bộ lọc: phòng ban chỉ mở sau khi chọn chi nhánh; đổi chi nhánh xoá phòng ban; tìm gửi đủ tham số', async ({
    page,
    api,
    employeesPage
  }) => {
    const { list, departments } = await stubList(api)
    await employeesPage.goto()

    await expect(employeesPage.select('Phòng ban')).toBeDisabled()
    await employeesPage.choose('Chi nhánh', 'Trụ sở')
    await expect.poll(() => departments.at(-1)?.query.get('branchId')).toBe('10')
    await employeesPage.choose('Phòng ban', 'Kỹ thuật')
    await employeesPage.keyword.fill('  thu  ')
    await employeesPage.searchButton.click()

    await expect(page).toHaveURL(/keyword=thu/)
    await expect.poll(() => list.at(-1)?.query.get('departmentId')).toBe('20')
    const last = list.at(-1)?.query
    expect(last?.get('keyword')).toBe('thu')
    expect(last?.get('branchId')).toBe('10')

    await employeesPage.choose('Chi nhánh', 'Tất cả')
    await expect(employeesPage.select('Phòng ban')).toBeDisabled()
    await expect(employeesPage.select('Phòng ban')).toContainText('Tất cả')
  })

  test('EMP-005 bấm dòng mở hồ sơ: thông tin cá nhân, công việc, ngân hàng', async ({ page, api, employeesPage }) => {
    await stubList(api)
    await api.route('/employees/142', { body: ok(DETAIL) })
    await employeesPage.goto()

    await page.getByRole('cell', { name: /Nguyễn Minh Thư/ }).click()

    await expect(page).toHaveURL(/\/dashboard\/employees\/142$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nguyễn Minh Thư')
    await expect(page.getByText('NV0142 · Kỹ sư phần mềm, Kỹ thuật · Vào làm 04/01/2024')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Thông tin công việc' })).toContainText('Trần Quốc Hưng')
    await expect(page.getByRole('region', { name: 'Ngân hàng & lương' })).toContainText('01234567891')
    await expect(page.getByRole('tab', { name: /Tài liệu/ })).toContainText('1')
  })

  test('EMP-006 không có EMPLOYEE_BANKING_VIEW: banking null → báo không có quyền', async ({
    page,
    api,
    employeesPage
  }) => {
    // HR without EMPLOYEE_BANKING_VIEW: the backend returns banking: null
    await api.route('/me', { body: ok({ ...HR, permissions: ['EMPLOYEE_VIEW'] }) })
    await api.route('/employees/142', { body: ok({ ...DETAIL, banking: null }) })

    await employeesPage.goto('/142')

    await expect(page.getByRole('region', { name: 'Ngân hàng & lương' })).toContainText(
      'Bạn không có quyền xem thông tin ngân hàng và lương.'
    )
  })

  test('EMP-007 @smoke thêm nhân viên: mỗi bước chặn trường bắt buộc; lưu POST đúng payload rồi mở hồ sơ', async ({
    page,
    api,
    employeesPage
  }) => {
    await stubWizardOptions(api)
    const posts = await api.route('/employees', { method: 'POST', body: ok({ ...DETAIL, id: '181' }) })
    await api.route('/employees/181', { body: ok({ ...DETAIL, id: '181' }) })
    await employeesPage.goto('/create')

    await employeesPage.nextButton.click()
    await expect(page.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    await employeesPage.field('Họ và tên').fill('Đặng Hoài Nam')
    await employeesPage.field('Điện thoại').fill('0935274810')
    await employeesPage.choose('Giới tính', 'Nam')
    await employeesPage.nextButton.click()

    // step 2: date of joining required
    await employeesPage.nextButton.click()
    await expect(page.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    await employeesPage.choose('Chi nhánh', 'Trụ sở')
    await employeesPage.choose('Phòng ban', 'Kỹ thuật')
    await employeesPage.choose('Chức danh', 'Kỹ sư phần mềm')
    await employeesPage.choose('Quản lý trực tiếp', 'Trần Quốc Hưng (NV0138)')
    await employeesPage.pickDay('Ngày vào làm', 15)
    await employeesPage.choose('Trạng thái', 'Thử việc')
    await employeesPage.nextButton.click()

    // step 3: banking, salary must be a number
    await employeesPage.field('Lương cơ bản').fill('abc')
    await employeesPage.nextButton.click()
    await expect(page.getByText('Nhập số ≥ 0, tối đa 2 chữ số thập phân')).toBeVisible()
    await employeesPage.field('Lương cơ bản').fill('16000000')
    await employeesPage.nextButton.click()

    // step 4: email required, password 8+ or empty
    await employeesPage.field('Mật khẩu ban đầu').fill('short')
    await page.getByRole('button', { name: 'Tạo nhân viên' }).click()
    await expect(page.getByText('Mật khẩu từ 8 đến 128 ký tự')).toBeVisible()
    expect(posts).toHaveLength(0)
    await employeesPage.field('Mật khẩu ban đầu').fill('')
    await employeesPage.field('Email').fill('nam.dang@e2e.invalid')
    await page.getByRole('button', { name: 'Tạo nhân viên' }).click()

    await expect(page).toHaveURL(/\/dashboard\/employees\/181$/)
    await expect(employeesPage.toast.filter({ hasText: 'Đã tạo nhân viên' })).toBeVisible()
    const body = posts[0].body
    expect(posts[0].query.has('companyId')).toBe(false)
    expect(body.email).toBe('nam.dang@e2e.invalid')
    expect(body).not.toHaveProperty('password')
    expect(body.documents).toBeUndefined()
    expect(body.profile).toMatchObject({
      fullName: 'Đặng Hoài Nam',
      phone: '0935274810',
      gender: 'MALE',
      branchId: 10,
      departmentId: 20,
      designationId: 30,
      reportsToId: 138,
      employmentType: 'FULL_TIME',
      status: 'PROBATION',
      banking: { baseSalary: 16000000 }
    })
    expect(body.profile.dateOfJoining).toMatch(/^\d{4}-\d{2}-15$/)
  })

  test('EMP-008 thêm nhân viên kèm tài liệu: tải tệp lên thư viện trước, gửi fileId; EMP_007 hiện lỗi', async ({
    page,
    api,
    employeesPage
  }) => {
    await stubWizardOptions(api)
    const uploads = await api.route('/media/files', {
      method: 'POST',
      body: ok([{ id: '77', originalName: 'cccd.pdf' }])
    })
    const posts = await api.route('/employees', {
      method: 'POST',
      status: 400,
      body: fail('EMP_007', 'Email này đã được nhân viên khác dùng: e2e-sentinel.')
    })
    await employeesPage.goto('/create')
    await employeesPage.field('Họ và tên').fill('Đặng Hoài Nam')
    await employeesPage.nextButton.click()
    await employeesPage.pickDay('Ngày vào làm', 1)
    await employeesPage.nextButton.click()
    await employeesPage.nextButton.click()
    await employeesPage.field('Email').fill('nam.dang@e2e.invalid')

    await page.getByRole('button', { name: 'Thêm tài liệu' }).click()
    const row = page.getByRole('group', { name: 'Tài liệu 1' })
    await page.getByRole('button', { name: 'Tạo nhân viên' }).click()
    await expect(row.getByText('Chọn tệp', { exact: true })).toBeVisible()
    await row.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Identity Proof' }).click()
    await row.locator('input[type=file]').setInputFiles({
      name: 'cccd.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 e2e')
    })
    await page.getByRole('button', { name: 'Tạo nhân viên' }).click()

    await expect(employeesPage.toast).toContainText('Email này đã được nhân viên khác dùng: e2e-sentinel.')
    await expect(page).toHaveURL(/\/create$/)
    expect(String(uploads[0].body)).toContain('cccd.pdf')
    expect(posts[0].body.documents).toEqual([{ documentTypeId: 1, fileId: 77 }])
  })

  test('EMP-009 sửa hồ sơ: điền sẵn; PUT thay toàn bộ, giữ shiftId và ảnh; bỏ ảnh thì không gửi profileImageId', async ({
    page,
    api,
    employeesPage
  }) => {
    await stubWizardOptions(api)
    // a saved photo (the link itself may be expired: the avatar falls back to initials)
    const withPhoto = { ...DETAIL, profileImageUrl: 'http://localhost:4173/e2e-photo.png' }
    await api.route('/employees/142', { method: 'GET', body: ok(withPhoto) })
    const puts = await api.route('/employees/142', { method: 'PUT', body: ok(withPhoto) })
    await employeesPage.goto('/142/edit')

    await expect(employeesPage.field('Họ và tên')).toHaveValue('Nguyễn Minh Thư')
    await expect(page.getByRole('list').getByText('Tài khoản & tài liệu')).toHaveCount(0)
    await employeesPage.field('Điện thoại').fill('0900000000')
    await employeesPage.nextButton.click()
    await employeesPage.nextButton.click()
    // reaching the last step must not submit (the Next button turns into Save in place)
    await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible()
    expect(puts).toHaveLength(0)
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()

    await expect(page).toHaveURL(/\/dashboard\/employees\/142$/)
    expect(puts[0].body).toMatchObject({
      fullName: 'Nguyễn Minh Thư',
      phone: '0900000000',
      profileImageId: 88,
      shiftId: 3,
      branchId: 10,
      departmentId: 20,
      designationId: 30,
      reportsToId: 138,
      dateOfJoining: '2024-01-04',
      status: 'ACTIVE',
      banking: { accountNumber: '01234567891', baseSalary: 17000000 }
    })

    await employeesPage.goto('/142/edit')
    await page.getByRole('button', { name: 'Bỏ ảnh' }).click()
    await employeesPage.nextButton.click()
    await employeesPage.nextButton.click()
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect.poll(() => puts.length).toBe(2)
    expect(puts[1].body).not.toHaveProperty('profileImageId')
  })

  test('EMP-010 thao tác hồ sơ: đổi trạng thái, khoá đăng nhập, đặt mật khẩu (khớp nhau), xoá về danh sách', async ({
    page,
    api,
    employeesPage
  }) => {
    await stubList(api)
    await api.route('/employees/142', { method: 'GET', body: ok(DETAIL) })
    const status = await api.route('/employees/142/status', { method: 'PUT', body: ok(DETAIL) })
    const login = await api.route('/employees/142/login', { method: 'PUT', body: ok(DETAIL) })
    const password = await api.route('/employees/142/password', { method: 'PUT', body: ok(null) })
    const deletes = await api.route('/employees/142', { method: 'DELETE', body: ok(null) })
    await employeesPage.goto('/142')

    await employeesPage.openAction('Đổi trạng thái')
    await employeesPage.dialog.getByLabel('Đã nghỉ việc').check()
    await employeesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect.poll(() => status[0]?.body).toEqual({ status: 'TERMINATED' })

    await employeesPage.openAction('Khoá đăng nhập')
    await expect(employeesPage.alertDialog).toContainText('mọi phiên đăng nhập kết thúc ngay')
    await employeesPage.alertDialog.getByRole('button', { name: 'Xác nhận' }).click()
    await expect.poll(() => login[0]?.body).toEqual({ enabled: false })

    await employeesPage.openAction('Đặt mật khẩu mới')
    await employeesPage.dialog.getByLabel('Mật khẩu mới').fill('Secret#2026')
    await employeesPage.dialog.getByLabel('Nhập lại mật khẩu').fill('Secret#2027')
    await employeesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(employeesPage.dialog.getByText('Mật khẩu nhập lại không khớp')).toBeVisible()
    expect(password).toHaveLength(0)
    await employeesPage.dialog.getByLabel('Nhập lại mật khẩu').fill('Secret#2026')
    await employeesPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect.poll(() => password[0]?.body).toEqual({ newPassword: 'Secret#2026', confirmPassword: 'Secret#2026' })

    await employeesPage.openAction('Xoá nhân viên')
    await employeesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect(page).toHaveURL(/\/dashboard\/employees(\?|$)/)
    expect(deletes).toHaveLength(1)
  })

  test('EMP-011 nhân viên chưa có tài khoản (EMP_013): khoá đăng nhập và đặt mật khẩu bị tắt', async ({
    page,
    api,
    employeesPage
  }) => {
    await api.route('/employees/142', { body: ok({ ...DETAIL, userId: null, loginEnabled: false }) })
    await employeesPage.goto('/142')

    await employeesPage.actionsMenu.click()

    await expect(page.getByRole('menuitem', { name: 'Mở đăng nhập' })).toBeDisabled()
    await expect(page.getByRole('menuitem', { name: 'Đặt mật khẩu mới' })).toBeDisabled()
  })

  test('EMP-012 tài liệu: hết hạn được đánh dấu; xác minh và xoá; thêm tải tệp rồi POST', async ({
    page,
    api,
    employeesPage
  }) => {
    await api.route('/employees/142', { method: 'GET', body: ok(DETAIL) })
    await api.route('/org/document-types/options', { body: ok(DOCUMENT_TYPES) })
    const verify = await api.route('/employees/142/documents/501/verify', { method: 'PUT', body: ok(DOCUMENT) })
    const removes = await api.route('/employees/142/documents/501', { method: 'DELETE', body: ok(null) })
    const uploads = await api.route('/media/files', { method: 'POST', body: ok([{ id: '78' }]) })
    const adds = await api.route('/employees/142/documents', { method: 'POST', body: ok(DOCUMENT) })
    await employeesPage.goto('/142?tab=DOCUMENTS')

    await expect(page.getByRole('row', { name: /cccd\.pdf/ })).toContainText('01/01/2025 · Đã hết hạn')
    await page.getByRole('button', { name: 'Xác minh cccd.pdf' }).click()
    await expect.poll(() => verify[0]?.body).toEqual({ verified: true })

    await page.getByRole('button', { name: 'Xoá cccd.pdf' }).click()
    await employeesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => removes.length).toBe(1)

    await page.getByRole('button', { name: 'Thêm tài liệu' }).click()
    await employeesPage.dialog.getByRole('combobox', { name: 'Loại tài liệu' }).click()
    await page.getByRole('option', { name: 'Address Proof' }).click()
    await employeesPage.dialog.locator('input[type=file]').setInputFiles({
      name: 'address.png',
      mimeType: 'image/png',
      buffer: Buffer.from('e2e')
    })
    await employeesPage.dialog.getByRole('button', { name: 'Thêm tài liệu' }).click()

    await expect.poll(() => adds[0]?.body).toEqual({ documentTypeId: 2, fileId: 78 })
    expect(uploads[0].query.get('companyId')).toBe('2')
  })

  test('EMP-013 tải thư PDF theo ngôn ngữ; xuất Excel theo bộ lọc', async ({ page, api, employeesPage }) => {
    await stubList(api)
    await api.route('/employees/142', { body: ok(DETAIL) })
    const letters = await api.route('/employees/142/letters/NOC', { body: ok(null) })
    const exports = await api.route('/employees/export', { body: ok(null) })

    await employeesPage.goto('/142?tab=LETTERS')
    await employeesPage.choose('Ngôn ngữ', 'English')
    const letter = page.waitForEvent('download')
    await page.getByRole('listitem').filter({ hasText: 'Giấy không phản đối (NOC)' }).getByRole('button').click()
    expect((await letter).suggestedFilename()).toBe('NV0142-noc-en.pdf')
    expect(letters[0].query.get('lang')).toBe('en')

    await employeesPage.goto('?tab=PROBATION&keyword=thu')
    const file = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất danh sách' }).click()
    expect((await file).suggestedFilename()).toBe('employees.xlsx')
    expect(exports[0].query.get('status')).toBe('PROBATION')
    expect(exports[0].query.get('keyword')).toBe('thu')
    expect(exports[0].query.has('page')).toBe(false)
  })

  test('EMP-014 nhập Excel: gửi multipart; hiện số đã tạo và các dòng bị từ chối', async ({
    page,
    api,
    employeesPage
  }) => {
    await stubList(api)
    const imports = await api.route('/employees/import', {
      method: 'POST',
      body: ok({ total: 3, created: 2, errors: [{ row: 4, code: 'EMP_022', message: 'Dòng 4: email bắt buộc.' }] })
    })
    await employeesPage.goto()

    await page.getByRole('button', { name: 'Nhập từ Excel' }).click()
    await expect(employeesPage.dialog.getByRole('button', { name: 'Nhập', exact: true })).toBeDisabled()
    await employeesPage.dialog.locator('input[type=file]').setInputFiles({
      name: 'nhan-vien.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('e2e')
    })
    await employeesPage.dialog.getByRole('button', { name: 'Nhập', exact: true }).click()

    await expect(employeesPage.dialog.getByRole('status')).toContainText('Đã tạo 2 / 3 nhân viên.')
    await expect(employeesPage.dialog.getByRole('list', { name: 'Các dòng bị từ chối' })).toContainText(
      'Dòng 4: Dòng 4: email bắt buộc.'
    )
    expect(String(imports[0].body)).toContain('nhan-vien.xlsx')
  })

  test('EMP-015 sơ đồ tổ chức: công ty trên cùng, nhân viên lồng dưới người quản lý', async ({
    page,
    api,
    employeesPage
  }) => {
    await api.route('/employees/org-chart', {
      body: ok({
        companyName: 'E2E Company',
        members: 2,
        children: [
          {
            id: '138',
            fullName: 'Trần Quốc Hưng',
            designation: 'Trưởng nhóm',
            active: true,
            children: [{ id: '142', fullName: 'Nguyễn Minh Thư', designation: 'Kỹ sư', active: false, children: [] }]
          }
        ]
      })
    })

    await employeesPage.goto('/org-chart')

    await expect(page.getByText('2 thành viên')).toBeVisible()
    const manager = page.getByRole('listitem').filter({ hasText: 'Trần Quốc Hưng' })
    await expect(manager.getByRole('listitem')).toContainText('Nguyễn Minh Thư')
    await expect(manager.getByRole('listitem').getByRole('img', { name: 'Tạm nghỉ' })).toBeVisible()
  })
})

test.describe('Nhân viên · super admin', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  })

  test('EMP-016 @smoke phải chọn công ty trước (EMP_019); chọn xong gửi companyId', async ({
    page,
    api,
    employeesPage
  }) => {
    await api.route('/iam/companies', { body: ok(pageOf([COMPANY])) })
    const { list, counts } = await stubList(api)

    await employeesPage.goto()

    await expect(page.getByText('Chọn công ty để xem và quản lý nhân viên.')).toBeVisible()
    await expect(employeesPage.addLink).toHaveCount(0)
    expect(list).toHaveLength(0)

    await employeesPage.choose('Công ty', 'E2E Company (E2ECO)')

    await expect(page).toHaveURL(/companyId=2/)
    await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
    expect(counts.at(-1)?.query.get('companyId')).toBe('2')
    await expect(employeesPage.addLink).toHaveAttribute('href', '/dashboard/employees/create?companyId=2')
  })

  test('EMP-017 thêm nhân viên cho công ty đã chọn: POST và tải tệp đều có companyId', async ({
    page,
    api,
    employeesPage
  }) => {
    await stubWizardOptions(api)
    const uploads = await api.route('/media/files', { method: 'POST', body: ok([{ id: '91' }]) })
    const posts = await api.route('/employees', { method: 'POST', body: ok({ ...DETAIL, id: '181' }) })
    await api.route('/employees/181', { body: ok({ ...DETAIL, id: '181' }) })
    await employeesPage.goto('/create?companyId=2')

    await employeesPage.field('Họ và tên').fill('Đặng Hoài Nam')
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'nam.png', mimeType: 'image/png', buffer: Buffer.from('e2e') })
    await employeesPage.nextButton.click()
    await employeesPage.pickDay('Ngày vào làm', 1)
    await employeesPage.nextButton.click()
    await employeesPage.nextButton.click()
    await employeesPage.field('Email').fill('nam.dang@e2e.invalid')
    await page.getByRole('button', { name: 'Tạo nhân viên' }).click()

    await expect(page).toHaveURL(/\/dashboard\/employees\/181$/)
    expect(uploads[0].query.get('companyId')).toBe('2')
    expect(posts[0].query.get('companyId')).toBe('2')
    expect(posts[0].body.profile.profileImageId).toBe(91)
  })
})

test.describe('Sơ đồ tổ chức · 2 chế độ xem', () => {
  const CHART = {
    companyName: 'E2E Company',
    members: 4,
    children: [
      {
        id: '138',
        fullName: 'Trần Quốc Hưng',
        designation: 'Trưởng nhóm',
        active: true,
        children: [
          { id: '142', fullName: 'Nguyễn Minh Thư', designation: 'Kỹ sư', active: false, children: [] },
          { id: '156', fullName: 'Lê Anh Dũng', designation: 'QA', active: true, children: [] }
        ]
      },
      { id: '119', fullName: 'Đỗ Quang Vinh', designation: 'Giám sát', active: true, children: [] }
    ]
  }

  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), HR)
    await api.route('/employees/org-chart', { body: ok(CHART) })
  })

  test('EMP-018 @smoke chuyển Danh sách ↔ Sơ đồ phân cấp (giữ trong URL); thu gọn / mở cấp dưới; thẻ mở hồ sơ', async ({
    page,
    employeesPage
  }) => {
    await employeesPage.goto('/org-chart')
    const views = page.getByRole('group', { name: 'Chế độ xem' })
    await expect(views.getByRole('button', { name: 'Danh sách' })).toHaveAttribute('aria-pressed', 'true')

    await views.getByRole('button', { name: 'Sơ đồ phân cấp' }).click()
    await expect(page).toHaveURL(/view=TREE/)
    await expect(views.getByRole('button', { name: 'Sơ đồ phân cấp' })).toHaveAttribute('aria-pressed', 'true')
    const tree = page.getByRole('group', { name: 'Sơ đồ phân cấp tổ chức' })
    await expect(tree).toContainText('E2E Company')
    await expect(tree.getByRole('link', { name: /Nguyễn Minh Thư/ })).toBeVisible()

    await tree.getByRole('button', { name: 'Thu gọn người báo cáo cho Trần Quốc Hưng' }).click()
    await expect(tree.getByRole('link', { name: /Nguyễn Minh Thư/ })).toHaveCount(0)
    const expand = tree.getByRole('button', { name: 'Mở 2 người báo cáo cho Trần Quốc Hưng' })
    await expect(expand).toHaveText('2')
    await expect(expand).toHaveAttribute('aria-expanded', 'false')
    await expand.click()
    await expect(tree.getByRole('link', { name: /Lê Anh Dũng/ })).toBeVisible()

    // F5 keeps the chosen view
    await page.reload()
    await expect(page.getByRole('group', { name: 'Sơ đồ phân cấp tổ chức' })).toBeVisible()

    await page
      .getByRole('group', { name: 'Sơ đồ phân cấp tổ chức' })
      .getByRole('link', { name: /Đỗ Quang Vinh/ })
      .click()
    await expect(page).toHaveURL(/\/dashboard\/employees\/119$/)
  })

  test('EMP-019 thu phóng sơ đồ: 50–150%, nút về 100%; chỉ có ở chế độ sơ đồ', async ({ page, employeesPage }) => {
    await employeesPage.goto('/org-chart')
    await expect(page.getByRole('button', { name: 'Phóng to' })).toHaveCount(0)

    await employeesPage.goto('/org-chart?view=TREE')
    const zoomIn = page.getByRole('button', { name: 'Phóng to' })
    const zoomOut = page.getByRole('button', { name: 'Thu nhỏ' })
    await expect(page.getByText('100%')).toBeVisible()
    for (let i = 0; i < 5; i++) await zoomIn.click()
    await expect(page.getByText('150%')).toBeVisible()
    await expect(zoomIn).toBeDisabled()
    await page.getByRole('button', { name: 'Về 100%' }).click()
    for (let i = 0; i < 5; i++) await zoomOut.click()
    await expect(page.getByText('50%')).toBeVisible()
    await expect(zoomOut).toBeDisabled()
    await expect(page.getByRole('group', { name: 'Sơ đồ phân cấp tổ chức' })).toHaveAttribute('style', /scale\(0\.5\)/)
  })
})
