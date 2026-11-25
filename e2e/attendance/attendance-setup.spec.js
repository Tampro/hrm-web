// @ts-check
// Feature: shifts + attendance policies (manual 6.4.5, 6.4.6). Spec sources: hrm-be attendance-service
// ShiftController / AttendancePolicyController, ShiftDtos (ShiftForm, Summary), AttendancePolicyDtos (PolicyForm, Summary).
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ATTENDANCE_VIEW'] }

const OFFICE = {
  id: '1',
  companyId: '2',
  name: 'Ca hành chính',
  description: 'Thứ 2 – Thứ 6',
  startTime: '08:00:00',
  endTime: '17:00:00',
  breakDurationMinutes: 60,
  breakStartTime: '12:00:00',
  breakEndTime: '13:00:00',
  gracePeriodMinutes: 10,
  nightShift: false,
  workingMinutes: 480,
  status: 'ACTIVE',
  createdDate: '2026-11-20T01:00:00Z',
  updatedDate: null
}
const NIGHT = {
  ...OFFICE,
  id: '2',
  name: 'Ca đêm kho',
  description: null,
  startTime: '22:00:00',
  endTime: '06:00:00',
  breakDurationMinutes: 30,
  breakStartTime: null,
  breakEndTime: null,
  workingMinutes: 450,
  nightShift: true,
  status: 'INACTIVE'
}
const NULL_SHIFT = Object.fromEntries(Object.keys(OFFICE).map((k) => [k, k === 'id' ? '3' : null]))

const STANDARD = {
  id: '7',
  companyId: '2',
  name: 'Chính sách chuẩn',
  description: null,
  lateArrivalGraceMinutes: 15,
  earlyDepartureGraceMinutes: 10,
  halfDayThresholdHours: 4,
  overtimeRatePerHour: 50000,
  status: 'ACTIVE',
  createdDate: '2026-11-20T01:00:00Z',
  updatedDate: null
}
const NULL_POLICY = Object.fromEntries(Object.keys(STANDARD).map((k) => [k, k === 'id' ? '8' : null]))
const VND = { id: '1', code: 'VND', symbol: '₫', defaultCurrency: true }

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubShifts = async (api, rows = [OFFICE, NIGHT, NULL_SHIFT]) => {
  const list = await api.route('/attendance/shifts', { method: 'GET', body: ok(pageOf(rows)) })
  const counts = await api.route('/attendance/shifts/status-counts', { body: ok({ all: 3, active: 1, inactive: 2 }) })
  const summary = await api.route('/attendance/shifts/summary', { body: ok({ total: 3, active: 1, day: 2, night: 1 }) })
  return { list, counts, summary }
}

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubPolicies = async (api, rows = [STANDARD, NULL_POLICY]) => {
  await api.route('/saas/currencies', { body: ok([VND]) })
  const list = await api.route('/attendance/policies', { method: 'GET', body: ok(pageOf(rows)) })
  const counts = await api.route('/attendance/policies/status-counts', { body: ok({ all: 2, active: 1, inactive: 1 }) })
  await api.route('/attendance/policies/summary', {
    body: ok({ total: 2, active: 1, avgLateArrivalGraceMinutes: 15, avgOvertimeRatePerHour: 50000 })
  })
  return { list, counts }
}

test('ATT-001 @smoke không có ATTENDANCE_VIEW: không có menu, không gọi API', async ({
  page,
  api,
  baseURL,
  shiftsPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { list } = await stubShifts(api)

  await shiftsPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ca làm việc' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Chính sách chấm công' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Ca làm việc · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('ATT-002 @smoke danh sách: thẻ tổng quan, giờ HH:mm, ca ngày/đêm; lọc loại ca và tab trạng thái', async ({
    page,
    api,
    shiftsPage
  }) => {
    const { list, counts } = await stubShifts(api)
    await shiftsPage.goto()

    const summary = page.getByRole('region', { name: 'Tổng quan ca làm việc' })
    await expect(summary).toContainText('Tổng số ca3')
    await expect(summary).toContainText('Ca đêm1')
    await expect(shiftsPage.row('Ca hành chính')).toContainText('08:00 – 17:00')
    await expect(shiftsPage.row('Ca hành chính')).toContainText('12:00 – 13:00')
    await expect(shiftsPage.row('Ca hành chính')).toContainText('8 giờ')
    await expect(shiftsPage.row('Ca đêm kho')).toContainText('22:00 – 06:00')
    await expect(shiftsPage.row('Ca đêm kho').getByText('Ca đêm', { exact: true })).toBeVisible()
    await expect(shiftsPage.tab('Tạm nghỉ')).toContainText('2')
    await expect(page.getByText('Hiển thị 3 / 3')).toBeVisible()
    expect(list[0].query.has('nightShift')).toBe(false)

    await shiftsPage.choose('Loại ca', 'Ca đêm')
    await shiftsPage.keyword.fill('  kho  ')
    await shiftsPage.searchButton.click()
    await expect.poll(() => list.at(-1)?.query.get('nightShift')).toBe('true')
    expect(list.at(-1)?.query.get('keyword')).toBe('kho')
    await expect.poll(() => counts.at(-1)?.query.get('nightShift')).toBe('true')
    expect(counts.at(-1)?.query.has('status')).toBe(false)

    await shiftsPage.tab('Tạm nghỉ').click()
    await expect.poll(() => list.at(-1)?.query.get('status')).toBe('INACTIVE')
    await shiftsPage.tab('Tất cả').click()
    await expect.poll(() => list.at(-1)?.query.has('status')).toBe(false)
  })

  test('ATT-003 thêm ca: giờ kết thúc phải sau giờ bắt đầu trừ ca đêm; POST giờ HH:mm và số', async ({
    api,
    shiftsPage
  }) => {
    await stubShifts(api)
    const posts = await api.route('/attendance/shifts', { method: 'POST', body: ok(NIGHT) })
    await shiftsPage.goto()

    await shiftsPage.page.getByRole('button', { name: 'Thêm ca' }).click()
    await shiftsPage.field('Tên ca').fill('  Ca đêm kho  ')
    await shiftsPage.field('Giờ bắt đầu').fill('22:00')
    await shiftsPage.field('Giờ kết thúc').fill('06:00')
    await shiftsPage.field('Bắt đầu nghỉ').fill('')
    await shiftsPage.dialog.getByRole('button', { name: 'Tạo ca' }).click()
    await expect(shiftsPage.dialog.getByText('Giờ kết thúc phải sau giờ bắt đầu (trừ ca đêm).')).toBeVisible()
    await expect(
      shiftsPage.dialog.getByText('Nhập cả giờ bắt đầu và kết thúc nghỉ, hoặc để trống cả hai.')
    ).toBeVisible()
    expect(posts).toHaveLength(0)

    await shiftsPage.dialog.getByRole('switch', { name: 'Ca đêm' }).click()
    await shiftsPage.field('Kết thúc nghỉ').fill('')
    await shiftsPage.field('Thời gian nghỉ (phút)').fill('30')
    await shiftsPage.dialog.getByRole('button', { name: 'Tạo ca' }).click()

    await expect(shiftsPage.toast.filter({ hasText: 'Đã tạo ca làm việc.' })).toBeVisible()
    expect(posts[0].body).toEqual({
      name: 'Ca đêm kho',
      startTime: '22:00',
      endTime: '06:00',
      breakDurationMinutes: 30,
      gracePeriodMinutes: 10,
      nightShift: true,
      status: 'ACTIVE'
    })
    await expect(shiftsPage.dialog).toHaveCount(0)
  })

  test('ATT-004 sửa ca: form nạp giờ HH:mm; PUT thay toàn bộ, bỏ mô tả đã xoá; bật/tắt và xoá', async ({
    api,
    shiftsPage
  }) => {
    await stubShifts(api)
    const puts = await api.route('/attendance/shifts/1', { method: 'PUT', body: ok(OFFICE) })
    const statuses = await api.route('/attendance/shifts/2/status', { method: 'PUT', body: ok(NIGHT) })
    const deletes = await api.route('/attendance/shifts/1', { method: 'DELETE', body: ok(null) })
    await shiftsPage.goto()

    await shiftsPage.page.getByRole('button', { name: 'Sửa Ca hành chính' }).click()
    await expect(shiftsPage.field('Giờ bắt đầu')).toHaveValue('08:00')
    await expect(shiftsPage.field('Bắt đầu nghỉ')).toHaveValue('12:00')
    await shiftsPage.field('Mô tả').fill('')
    await shiftsPage.field('Thời gian ân hạn (phút)').fill('5')
    await shiftsPage.dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      name: 'Ca hành chính',
      startTime: '08:00',
      endTime: '17:00',
      breakDurationMinutes: 60,
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      gracePeriodMinutes: 5,
      nightShift: false,
      status: 'ACTIVE'
    })

    await shiftsPage.page.getByRole('switch', { name: 'Bật/tắt Ca đêm kho' }).click()
    await expect.poll(() => statuses[0]?.body).toEqual({ status: 'ACTIVE' })
    // the switch is usable again once the request is done
    await expect(shiftsPage.page.getByRole('switch', { name: 'Bật/tắt Ca đêm kho' })).toBeEnabled()

    await shiftsPage.page.getByRole('button', { name: 'Xóa Ca hành chính' }).click()
    await shiftsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => deletes.length).toBe(1)
  })
})

test('ATT-005 chỉ ATTENDANCE_VIEW: không có nút thêm, sửa, xoá, bật/tắt', async ({
  page,
  api,
  baseURL,
  shiftsPage
}) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubShifts(api)

  await shiftsPage.goto()

  await expect(shiftsPage.row('Ca hành chính')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Thêm ca' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(Sửa|Xóa) Ca/ })).toHaveCount(0)
  await expect(page.getByRole('switch')).toHaveCount(0)
})

test('ATT-006 @smoke super admin: chọn công ty trước; tạo ca gửi companyId', async ({
  page,
  api,
  baseURL,
  shiftsPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const { list } = await stubShifts(api)
  const posts = await api.route('/attendance/shifts', { method: 'POST', body: ok(OFFICE) })

  await shiftsPage.goto()
  await expect(page.getByText('Chọn công ty để xem dữ liệu chấm công.')).toBeVisible()
  expect(list).toHaveLength(0)

  await shiftsPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  await page.getByRole('button', { name: 'Thêm ca' }).click()
  await shiftsPage.field('Tên ca').fill('Ca sáng')
  await shiftsPage.dialog.getByRole('button', { name: 'Tạo ca' }).click()
  await expect.poll(() => posts[0]?.query.get('companyId')).toBe('2')
})

test.describe('Chính sách chấm công', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('ATT-007 @smoke danh sách: phút ân hạn, nửa ngày, đơn giá tăng ca theo tiền tệ công ty; dòng null hiện an toàn', async ({
    page,
    api,
    attendancePoliciesPage
  }) => {
    const { list } = await stubPolicies(api)
    await attendancePoliciesPage.goto()

    const row = attendancePoliciesPage.row('Chính sách chuẩn')
    await expect(row).toContainText('15 phút')
    await expect(row).toContainText('10 phút')
    await expect(row).toContainText('4 giờ')
    await expect(row).toContainText(/50\.000\s*₫\/giờ/)
    await expect(page.getByRole('region', { name: 'Tổng quan chính sách' })).toContainText('Tổng số chính sách2')
    await expect(page.getByText('Hiển thị 2 / 2')).toBeVisible()

    await attendancePoliciesPage.keyword.fill('chuẩn')
    await attendancePoliciesPage.searchButton.click()
    await expect.poll(() => list.at(-1)?.query.get('keyword')).toBe('chuẩn')
  })

  test('ATT-008 thêm: mặc định 15 / 15 phút, 4 giờ; đơn giá bắt buộc; POST số', async ({
    api,
    attendancePoliciesPage
  }) => {
    await stubPolicies(api)
    const posts = await api.route('/attendance/policies', { method: 'POST', body: ok(STANDARD) })
    await attendancePoliciesPage.goto()

    await attendancePoliciesPage.page.getByRole('button', { name: 'Thêm chính sách' }).click()
    await expect(attendancePoliciesPage.field('Ân hạn đi muộn (phút)')).toHaveValue('15')
    await expect(attendancePoliciesPage.field('Ngưỡng nửa ngày (giờ)')).toHaveValue('4')
    await attendancePoliciesPage.field('Tên chính sách').fill('Chính sách kho')
    await attendancePoliciesPage.field('Ngưỡng nửa ngày (giờ)').fill('25')
    await attendancePoliciesPage.dialog.getByRole('button', { name: 'Tạo chính sách' }).click()
    await expect(attendancePoliciesPage.dialog.getByText('Giá trị tối đa là 24')).toBeVisible()
    await expect(attendancePoliciesPage.dialog.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(posts).toHaveLength(0)

    await attendancePoliciesPage.field('Ngưỡng nửa ngày (giờ)').fill('4.5')
    await attendancePoliciesPage.field('Đơn giá tăng ca / giờ (₫)').fill('60000')
    await attendancePoliciesPage.dialog.getByRole('button', { name: 'Tạo chính sách' }).click()

    await expect(attendancePoliciesPage.toast.filter({ hasText: 'Đã tạo chính sách.' })).toBeVisible()
    expect(posts[0].body).toEqual({
      name: 'Chính sách kho',
      lateArrivalGraceMinutes: 15,
      earlyDepartureGraceMinutes: 15,
      halfDayThresholdHours: 4.5,
      overtimeRatePerHour: 60000,
      status: 'ACTIVE'
    })
  })
})
