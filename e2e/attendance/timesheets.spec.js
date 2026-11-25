// @ts-check
// Feature: timesheet (manual 6.4.2). Spec sources: hrm-be attendance-service TimesheetController (week, entries,
// approve / reject, export, import), TimesheetDtos (Week, WeekRow, DayCell, StatusCounts, EntryForm), ERegularizationStatus.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE', 'EMPLOYEE_VIEW'] }
const VIEWER = { ...FAKE_ME, permissions: ['ATTENDANCE_VIEW', 'EMPLOYEE_VIEW'] }

// a fixed past week (Mon 2026-02-02 … Sun 2026-02-08); any day of it is a valid ?date=
const QUERY = '?date=2026-02-04'
const WEEK = {
  weekStart: '2026-02-02',
  weekEnd: '2026-02-08',
  rows: [
    {
      employeeId: '101',
      fullName: 'Nguyễn Minh Thư',
      designation: 'Kỹ sư phần mềm',
      profileImageUrl: null,
      total: 15.5,
      days: [
        { date: '2026-02-02', hours: 8, entries: 2, status: 'PENDING' },
        { date: '2026-02-03', hours: 7.5, entries: 1, status: 'APPROVED' },
        { date: '2026-02-04', hours: 0, entries: 0, status: null }
      ]
    },
    { employeeId: '102', fullName: null, designation: null, days: null, total: null }
  ],
  counts: { all: 3, pending: 2, approved: 1, rejected: 0 },
  page: 0,
  size: 10,
  totalElements: 2
}
const ENTRIES = [
  {
    id: '501',
    employeeId: '101',
    date: '2026-02-02',
    hours: 6.5,
    project: 'HRM portal',
    description: 'Code review',
    status: 'PENDING',
    managerComments: null
  },
  {
    id: '502',
    employeeId: '101',
    date: '2026-02-02',
    hours: 1.5,
    project: null,
    description: 'Họp nhóm',
    status: 'REJECTED',
    managerComments: 'Trùng giờ họp'
  }
]
const EMPLOYEES = [{ id: '101', fullName: 'Nguyễn Minh Thư', employeeCode: 'NV0142' }]

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stub = async (api) => {
  const week = await api.route('/attendance/timesheets/week', { body: ok(WEEK) })
  await api.route('/employees', { method: 'GET', body: ok(pageOf(EMPLOYEES)) })
  const day = await api.route('/attendance/timesheets/entries', { method: 'GET', body: ok(ENTRIES) })
  return { week, day }
}

test('TS-001 @smoke không có ATTENDANCE_VIEW: không có menu, không gọi API', async ({ page, api, baseURL }) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { week } = await stub(api)

  await page.goto('/dashboard/attendance/timesheets')

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Bảng giờ công' })).toHaveCount(0)
  expect(week).toHaveLength(0)
})

test.describe('Bảng giờ công · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('TS-002 @smoke lưới tuần: giờ / số mục / trạng thái mỗi ngày, ngày trống "—", tổng tuần; tab đếm; đổi tuần và lọc gửi API', async ({
    page,
    api
  }) => {
    const { week } = await stub(api)
    await page.goto(`/dashboard/attendance/timesheets${QUERY}`)

    await expect.poll(() => week.at(-1)?.query.get('date')).toBe('2026-02-02')
    expect(week.at(-1)?.query.has('status')).toBe(false)
    const row = page.getByRole('row').filter({ hasText: 'Nguyễn Minh Thư' })
    await expect(row.getByRole('cell').nth(0)).toContainText('8h')
    await expect(row.getByRole('cell').nth(0)).toContainText('Xem 2 mục')
    await expect(row.getByRole('cell').nth(0)).toContainText('Chờ duyệt')
    await expect(row.getByRole('cell').nth(1)).toContainText('Đã duyệt')
    await expect(row.getByRole('cell').nth(2)).toHaveText('—')
    await expect(row.getByRole('cell').last()).toHaveText('15,5h')
    // an all-null employee row still renders
    await expect(page.getByRole('row').filter({ hasText: '0h' })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Chờ duyệt/ })).toContainText('2')
    await expect(page.getByText('02/02/2026 – 08/02/2026')).toBeVisible()

    await page.getByRole('button', { name: 'Tuần sau' }).click()
    await expect.poll(() => week.at(-1)?.query.get('date')).toBe('2026-02-09')
    await page.getByRole('tab', { name: /^Chờ duyệt/ }).click()
    await expect.poll(() => week.at(-1)?.query.get('status')).toBe('PENDING')
    await page.getByRole('textbox', { name: 'Từ khoá' }).fill('  thư  ')
    await page.getByRole('button', { name: 'Tìm kiếm' }).click()
    await expect.poll(() => week.at(-1)?.query.get('keyword')).toBe('thư')
    await page.getByRole('tab', { name: /^Tất cả/ }).click()
    await expect.poll(() => week.at(-1)?.query.has('status')).toBe(false)
  })

  test('TS-003 "Xem tất cả": danh sách mục trong ngày; duyệt / từ chối chỉ mục chờ duyệt; xoá', async ({
    page,
    api
  }) => {
    const { day } = await stub(api)
    const approves = await api.route('/attendance/timesheets/entries/501/approve', {
      method: 'PUT',
      body: ok(ENTRIES[0])
    })
    const rejects = await api.route('/attendance/timesheets/entries/501/reject', {
      method: 'PUT',
      body: ok(ENTRIES[0])
    })
    const deletes = await api.route('/attendance/timesheets/entries/502', { method: 'DELETE', body: ok(null) })
    await page.goto(`/dashboard/attendance/timesheets${QUERY}`)

    await page.getByRole('button', { name: 'Xem giờ công của Nguyễn Minh Thư ngày 02/02/2026' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nguyễn Minh Thư · 02/02/2026' })
    await expect(dialog).toContainText('2 mục, tổng 8 giờ')
    expect(day.at(-1)?.query.get('employeeId')).toBe('101')
    expect(day.at(-1)?.query.get('date')).toBe('2026-02-02')
    await expect(dialog.getByRole('listitem').filter({ hasText: 'HRM portal' })).toContainText('6,5 giờ')
    await expect(dialog.getByRole('listitem').filter({ hasText: 'Họp nhóm' })).toContainText('Không có dự án')
    // decided entries cannot be approved or rejected again
    await expect(dialog.getByRole('button', { name: 'Duyệt Không có dự án' })).toHaveCount(0)

    await dialog.getByRole('button', { name: 'Duyệt HRM portal' }).click()
    await expect.poll(() => approves.length).toBe(1)
    await dialog.getByRole('button', { name: 'Từ chối HRM portal' }).click()
    await expect.poll(() => rejects.length).toBe(1)

    await dialog.getByRole('button', { name: 'Xóa Không có dự án' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => deletes.length).toBe(1)
  })

  test('TS-004 thêm: số giờ 0,25–24, mô tả bắt buộc; POST số giờ là số, bỏ dự án trống', async ({ page, api }) => {
    await stub(api)
    const posts = await api.route('/attendance/timesheets/entries', { method: 'POST', body: ok(ENTRIES[0]) })
    await page.goto(`/dashboard/attendance/timesheets${QUERY}&employeeId=101`)

    await page.getByRole('button', { name: 'Thêm giờ công' }).click()
    const dialog = page.getByRole('dialog', { name: 'Thêm giờ công' })
    await expect(dialog.getByRole('combobox', { name: 'Nhân viên' })).toContainText('Nguyễn Minh Thư')
    await dialog.getByRole('textbox', { name: 'Số giờ' }).fill('25')
    await dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(dialog.getByText('Số giờ từ 0,25 đến 24, tối đa 2 chữ số thập phân.')).toBeVisible()
    await expect(dialog.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(posts).toHaveLength(0)

    await dialog.getByRole('textbox', { name: 'Số giờ' }).fill('6.5')
    await dialog.getByRole('textbox', { name: 'Mô tả công việc' }).fill('  Viết tài liệu  ')
    await dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'Đã thêm giờ công.' })).toBeVisible()
    expect(posts[0].body).toMatchObject({ employeeId: 101, hours: 6.5, description: 'Viết tài liệu' })
    expect(posts[0].body).not.toHaveProperty('project')
  })

  test('TS-005 sửa từ danh sách ngày: PUT thay toàn bộ; xem chi tiết chỉ đọc, hiện nhận xét quản lý', async ({
    page,
    api
  }) => {
    await stub(api)
    const puts = await api.route('/attendance/timesheets/entries/501', { method: 'PUT', body: ok(ENTRIES[0]) })
    await page.goto(`/dashboard/attendance/timesheets${QUERY}`)

    await page.getByRole('button', { name: 'Xem giờ công của Nguyễn Minh Thư ngày 02/02/2026' }).click()
    await page.getByRole('button', { name: 'Xem Không có dự án' }).click()
    const view = page.getByRole('dialog', { name: 'Chi tiết giờ công' })
    await expect(view).toContainText('Trùng giờ họp')
    await expect(view.getByRole('textbox', { name: 'Số giờ' })).toBeDisabled()
    await expect(view.getByRole('button', { name: 'Lưu' })).toHaveCount(0)
    await view.getByRole('button', { name: 'Đóng' }).click()

    await page.getByRole('button', { name: 'Sửa HRM portal' }).click()
    const edit = page.getByRole('dialog', { name: 'Sửa giờ công' })
    await expect(edit.getByRole('textbox', { name: 'Số giờ' })).toHaveValue('6.5')
    await edit.getByRole('textbox', { name: 'Số giờ' }).fill('7')
    await edit.getByRole('button', { name: 'Lưu' }).click()
    await expect
      .poll(() => puts[0]?.body)
      .toEqual({
        employeeId: 101,
        date: '2026-02-02',
        hours: 7,
        project: 'HRM portal',
        description: 'Code review'
      })
  })
})

test('TS-006 chỉ ATTENDANCE_VIEW: xem mục trong ngày, không thêm / nhập / duyệt / sửa / xoá', async ({
  page,
  api,
  baseURL
}) => {
  await api.signIn(String(baseURL), VIEWER)
  await stub(api)

  await page.goto(`/dashboard/attendance/timesheets${QUERY}`)

  await expect(page.getByRole('button', { name: 'Thêm giờ công' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Nhập Excel' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Xem giờ công của Nguyễn Minh Thư ngày 02/02/2026' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nguyễn Minh Thư · 02/02/2026' })
  await expect(dialog.getByRole('button', { name: 'Xem HRM portal' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: /^(Sửa|Duyệt|Từ chối|Xóa) / })).toHaveCount(0)
})
