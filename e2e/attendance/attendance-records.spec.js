// @ts-check
// Feature: attendance records calendar (manual 6.4.1). Spec sources: hrm-be attendance-service
// AttendanceRecordController (calendar, CRUD, export, import), RecordDtos (RecordForm, DayCell, EmployeeRow, Calendar,
// ImportResult), EDayStatus.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE', 'EMPLOYEE_VIEW', 'ORG_VIEW'] }
const VIEWER = { ...FAKE_ME, permissions: ['ATTENDANCE_VIEW', 'EMPLOYEE_VIEW', 'ORG_VIEW'] }

// a fixed past month so FUTURE never appears and every day can be clicked
const QUERY = '?year=2026&month=2'
const day = (/** @type {number} */ d) => `2026-02-${String(d).padStart(2, '0')}`

const ROW = {
  employeeId: '101',
  fullName: 'Nguyễn Minh Thư',
  employeeCode: 'NV0142',
  designation: 'Kỹ sư phần mềm',
  profileImageUrl: null,
  attended: 1.5,
  workingDays: 20,
  days: [
    {
      date: day(2),
      status: 'PRESENT',
      weekend: false,
      late: true,
      earlyDeparture: false,
      overtime: false,
      clockIn: '08:25:00',
      clockOut: '17:30:00',
      notes: 'Kẹt xe',
      recordId: '900'
    },
    {
      date: day(3),
      status: 'HALF_DAY',
      weekend: false,
      late: false,
      earlyDeparture: true,
      overtime: false,
      recordId: '901'
    },
    { date: day(4), status: 'NOT_ADDED', weekend: false, recordId: null },
    { date: day(7), status: 'DAY_OFF', weekend: true, recordId: null }
  ]
}
const NULL_ROW = {
  employeeId: '102',
  fullName: null,
  employeeCode: null,
  designation: null,
  days: null,
  attended: null
}
const CALENDAR = {
  year: 2026,
  month: 2,
  today: '2026-11-25',
  weeklyOffDays: ['SATURDAY', 'SUNDAY'],
  rows: [ROW, NULL_ROW],
  page: 0,
  size: 10,
  totalElements: 2
}
const EMPLOYEES = [{ id: '101', fullName: 'Nguyễn Minh Thư', employeeCode: 'NV0142' }]

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stub = async (api) => {
  const calendar = await api.route('/attendance/records/calendar', { body: ok(CALENDAR) })
  await api.route('/employees', { method: 'GET', body: ok(pageOf(EMPLOYEES)) })
  return { calendar }
}

/** @param {import('@playwright/test').Page} page @param {string} label */
const cell = (page, label) => page.getByRole('button', { name: label })

test('REC-001 @smoke không có ATTENDANCE_VIEW: không có menu, không gọi API', async ({ page, api, baseURL }) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { calendar } = await stub(api)

  await page.goto('/dashboard/attendance/records')

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Chấm công' })).toHaveCount(0)
  expect(calendar).toHaveLength(0)
})

test.describe('Chấm công · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('REC-002 @smoke lịch tháng: chú thích, trạng thái + cờ đi muộn/về sớm, tổng công; lọc tháng / nhân viên gửi API', async ({
    page,
    api
  }) => {
    const { calendar } = await stub(api)
    await page.goto(`/dashboard/attendance/records${QUERY}`)

    await expect.poll(() => calendar.at(-1)?.query.get('month')).toBe('2')
    expect(calendar.at(-1)?.query.get('year')).toBe('2026')
    expect(calendar.at(-1)?.query.get('page')).toBe('0')

    const legend = page.getByRole('list', { name: 'Chú thích' })
    for (const label of [
      'Có mặt',
      'Vắng mặt',
      'Nửa ngày',
      'Nghỉ phép',
      'Ngày lễ',
      'Chưa chấm công',
      'Đi muộn',
      'Tăng ca'
    ]) {
      await expect(legend).toContainText(label)
    }
    const row = page.getByRole('row').filter({ hasText: 'Nguyễn Minh Thư' })
    await expect(row).toContainText('NV0142 · Kỹ sư phần mềm')
    await expect(row).toContainText('1,5 / 20')
    await expect(cell(page, 'Nguyễn Minh Thư · 02/02/2026, Có mặt, Đi muộn')).toBeVisible()
    await expect(cell(page, 'Nguyễn Minh Thư · 03/02/2026, Nửa ngày, Về sớm')).toBeVisible()
    await expect(cell(page, 'Nguyễn Minh Thư · 07/02/2026, Ngày nghỉ')).toBeVisible()
    // days the backend leaves out show as Not added; an all-null row still renders
    await expect(cell(page, 'Nguyễn Minh Thư · 10/02/2026, Chưa chấm công')).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: '0 / 0' })).toBeVisible()
    await expect(page.getByRole('columnheader')).toHaveCount(28 + 2)

    await page.getByRole('combobox', { name: 'Tháng', exact: true }).click()
    await page.getByRole('option', { name: 'Tháng 3', exact: true }).click()
    await expect.poll(() => calendar.at(-1)?.query.get('month')).toBe('3')
    await page.getByRole('combobox', { name: 'Nhân viên', exact: true }).click()
    await page.getByRole('option', { name: 'Nguyễn Minh Thư · NV0142' }).click()
    await expect.poll(() => calendar.at(-1)?.query.get('employeeId')).toBe('101')
    await expect(page.getByRole('button', { name: /Xoá bộ lọc/ })).toContainText('2')
  })

  test('REC-003 bấm ô Chưa chấm công: form thêm điền sẵn nhân viên + ngày; giờ ra cần giờ vào; POST bỏ trường trống', async ({
    page,
    api
  }) => {
    await stub(api)
    const posts = await api.route('/attendance/records', { method: 'POST', body: ok({ id: '902' }) })
    await page.goto(`/dashboard/attendance/records${QUERY}`)

    await cell(page, 'Nguyễn Minh Thư · 04/02/2026, Chưa chấm công').click()
    const dialog = page.getByRole('dialog', { name: 'Thêm bản ghi chấm công' })
    await expect(dialog.getByRole('combobox', { name: 'Nhân viên' })).toContainText('Nguyễn Minh Thư')
    await dialog.getByRole('textbox', { name: 'Giờ ra' }).fill('17:00')
    await dialog.getByRole('button', { name: 'Thêm bản ghi' }).click()
    await expect(dialog.getByText('Có giờ ra thì phải có giờ vào.')).toBeVisible()
    expect(posts).toHaveLength(0)

    await dialog.getByRole('textbox', { name: 'Giờ vào' }).fill('08:00')
    await dialog.getByRole('button', { name: 'Thêm bản ghi' }).click()
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'Đã thêm bản ghi chấm công.' })).toBeVisible()
    expect(posts[0].body).toEqual({ employeeId: 101, date: day(4), clockIn: '08:00', clockOut: '17:00' })
  })

  test('REC-004 bấm ô có bản ghi: sửa (PUT thay toàn bộ, xoá ghi chú thì không gửi) và xoá', async ({ page, api }) => {
    await stub(api)
    const puts = await api.route('/attendance/records/900', { method: 'PUT', body: ok({ id: '900' }) })
    const deletes = await api.route('/attendance/records/900', { method: 'DELETE', body: ok(null) })
    await page.goto(`/dashboard/attendance/records${QUERY}`)

    await cell(page, 'Nguyễn Minh Thư · 02/02/2026, Có mặt, Đi muộn').click()
    const dialog = page.getByRole('dialog', { name: 'Sửa bản ghi chấm công' })
    await expect(dialog.getByRole('textbox', { name: 'Giờ vào' })).toHaveValue('08:25')
    await expect(dialog.getByRole('textbox', { name: 'Ghi chú' })).toHaveValue('Kẹt xe')
    await dialog.getByRole('textbox', { name: 'Ghi chú' }).fill('')
    await dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect
      .poll(() => puts[0]?.body)
      .toEqual({
        employeeId: 101,
        date: day(2),
        clockIn: '08:25',
        clockOut: '17:30'
      })

    await cell(page, 'Nguyễn Minh Thư · 02/02/2026, Có mặt, Đi muộn').click()
    await dialog.getByRole('button', { name: 'Xoá', exact: true }).filter({ hasText: 'Xoá' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => deletes.length).toBe(1)
  })

  test('REC-005 xuất Excel theo tháng đang xem; nhập file hiện số dòng thêm / cập nhật / lỗi', async ({
    page,
    api
  }) => {
    await stub(api)
    await page.route('**/api/v1/attendance/records/export**', (route) =>
      route.fulfill({
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Buffer.from('xlsx')
      })
    )
    const imports = await api.route('/attendance/records/import', {
      method: 'POST',
      body: ok({ total: 3, created: 1, updated: 1, errors: [{ row: 4, code: 'ATT_010', message: 'Thiếu giờ vào' }] })
    })
    await page.goto(`/dashboard/attendance/records${QUERY}`)

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất Excel' }).click()
    expect((await download).suggestedFilename()).toBe('attendance-2026-02.xlsx')

    await page.getByRole('button', { name: 'Nhập Excel' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nhập chấm công' })
    await dialog.locator('input[type=file]').setInputFiles({
      name: 'cham-cong.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('xlsx')
    })
    await dialog.getByRole('button', { name: 'Nhập', exact: true }).click()
    const result = dialog.getByRole('region', { name: 'Kết quả nhập' })
    await expect(result).toContainText('3 dòng: thêm 1, cập nhật 1, lỗi 1.')
    await expect(result).toContainText('Dòng 4: Thiếu giờ vào')
    expect(imports).toHaveLength(1)
  })
})

test('REC-006 chỉ ATTENDANCE_VIEW: xem và xuất được, không thêm / nhập / bấm ô', async ({ page, api, baseURL }) => {
  await api.signIn(String(baseURL), VIEWER)
  await stub(api)

  await page.goto(`/dashboard/attendance/records${QUERY}`)

  await expect(page.getByRole('row').filter({ hasText: 'Nguyễn Minh Thư' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Xuất Excel' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Thêm bản ghi' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Nhập Excel' })).toHaveCount(0)
  await expect(cell(page, 'Nguyễn Minh Thư · 04/02/2026, Chưa chấm công')).toBeDisabled()
})
