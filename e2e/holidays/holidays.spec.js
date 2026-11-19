// @ts-check
// Feature: holidays (manual 6.3.4). Spec sources: hrm-be employee-service HolidayController, HolidayDtos
// (HolidayForm, CategoryForm, Filter), EEmployeeError EMP_010 / EMP_034 / EMP_035 / EMP_036.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ORG_VIEW', 'ORG_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ORG_VIEW'] }

const CATEGORIES = [
  { id: '1', name: 'National', color: '#E53935', system: true },
  { id: '2', name: 'Religious', color: '#8E24AA', system: true },
  { id: '9', name: 'Lễ hội E2E', color: '#FB8C00', system: false }
]
const BRANCHES = [
  { id: '10', name: 'Trụ sở' },
  { id: '11', name: 'Chi nhánh HCM' }
]
const NATIONAL_DAY = {
  id: '100',
  companyId: '2',
  name: 'Quốc khánh',
  category: CATEGORIES[0],
  startDate: '2026-09-01',
  endDate: '2026-09-02',
  days: 2,
  description: 'Nghỉ lễ 2/9',
  allBranches: true,
  branches: [],
  createdDate: '2026-01-02T02:00:00Z',
  updatedDate: null
}
const LOCAL_DAY = {
  ...NATIONAL_DAY,
  id: '101',
  name: 'Lễ hội E2E',
  category: CATEGORIES[2],
  startDate: '2026-09-15',
  endDate: '2026-09-15',
  days: 1,
  description: null,
  allBranches: false,
  branches: [{ id: '11', name: 'Chi nhánh HCM' }]
}
const NULL_HOLIDAY = Object.fromEntries(Object.keys(NATIONAL_DAY).map((k) => [k, k === 'id' ? '102' : null]))

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubPage = async (api, rows = [NATIONAL_DAY, LOCAL_DAY, NULL_HOLIDAY]) => {
  const list = await api.route('/org/holidays', { method: 'GET', body: ok(pageOf(rows)) })
  const categories = await api.route('/org/holiday-categories', { method: 'GET', body: ok(CATEGORIES) })
  await api.route('/org/branches/options', { body: ok(BRANCHES) })
  const calendar = await api.route('/org/holidays/calendar', { body: ok([NATIONAL_DAY, LOCAL_DAY]) })
  return { list, categories, calendar }
}

test('HOL-001 @smoke không có ORG_VIEW: không có menu, không gọi API', async ({ page, api, baseURL, holidaysPage }) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { list } = await stubPage(api)

  await holidaysPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ngày lễ' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Ngày lễ · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('HOL-002 @smoke danh sách: khoảng ngày + số ngày, loại hệ thống dịch tên, tất cả / từng chi nhánh; sắp theo ngày', async ({
    page,
    api,
    holidaysPage
  }) => {
    const { list } = await stubPage(api)
    await holidaysPage.goto()

    await expect(holidaysPage.row('Quốc khánh')).toContainText('01/09/2026 – 02/09/2026')
    await expect(holidaysPage.row('Quốc khánh')).toContainText('2 ngày')
    await expect(holidaysPage.row('Quốc khánh')).toContainText('Quốc gia')
    await expect(holidaysPage.row('Quốc khánh')).toContainText('Tất cả chi nhánh')
    await expect(holidaysPage.row('Lễ hội E2E').nth(0)).toContainText('Chi nhánh HCM')
    await expect(page.getByText('Hiển thị 3 / 3')).toBeVisible()
    expect(list[0].query.get('sort')).toBe('startDate,asc')
    expect(list[0].query.has('companyId')).toBe(false)
  })

  test('HOL-003 bộ lọc: loại, năm, khoảng ngày gửi đúng tham số; đếm bộ lọc; khoảng ngày ngược bị chặn; xoá lọc', async ({
    page,
    api,
    holidaysPage
  }) => {
    const { list } = await stubPage(api)
    await holidaysPage.goto()

    await holidaysPage.choose('Loại', 'Quốc gia')
    await holidaysPage.choose('Năm', '2026')
    await holidaysPage.pickDay('Từ ngày', 20)
    await holidaysPage.pickDay('Đến ngày', 10)
    await expect(page.getByText('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu')).toBeVisible()
    await holidaysPage.searchButton.click()
    await expect.poll(() => list.length).toBe(1)

    await holidaysPage.pickDay('Đến ngày', 25)
    await holidaysPage.keyword.fill('  lễ  ')
    await holidaysPage.searchButton.click()
    await expect.poll(() => list.at(-1)?.query.get('categoryId')).toBe('1')
    const q = list.at(-1)?.query
    expect(q?.get('year')).toBe('2026')
    expect(q?.get('keyword')).toBe('lễ')
    expect(q?.get('dateFrom')).toMatch(/^\d{4}-\d{2}-20$/)
    expect(q?.get('dateTo')).toMatch(/^\d{4}-\d{2}-25$/)
    await expect(holidaysPage.clearButton).toContainText('5')

    await holidaysPage.clearButton.click()
    await expect.poll(() => list.at(-1)?.query.has('categoryId')).toBe(false)
    await expect(holidaysPage.clearButton).not.toContainText(/\d/)
  })

  test('HOL-004 thêm: bắt buộc; ngày kết thúc trước ngày bắt đầu bị chặn; không chọn chi nhánh = tất cả', async ({
    page,
    api,
    holidaysPage
  }) => {
    await stubPage(api)
    const posts = await api.route('/org/holidays', { method: 'POST', body: ok(NATIONAL_DAY) })
    await holidaysPage.goto()

    await holidaysPage.addButton.click()
    await holidaysPage.dialog.getByRole('button', { name: 'Thêm ngày lễ' }).click()
    await expect(holidaysPage.dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(4)
    expect(posts).toHaveLength(0)

    await holidaysPage.field('Tên ngày lễ').fill('  Giỗ Tổ  ')
    await holidaysPage.choose('Loại', 'Quốc gia', holidaysPage.dialog)
    await holidaysPage.pickDay('Ngày bắt đầu', 20, holidaysPage.dialog)
    await holidaysPage.pickDay('Ngày kết thúc', 18, holidaysPage.dialog)
    await expect(holidaysPage.dialog.getByText('Ngày kết thúc không được trước ngày bắt đầu')).toBeVisible()
    await holidaysPage.pickDay('Ngày kết thúc', 21, holidaysPage.dialog)
    await holidaysPage.dialog.getByRole('button', { name: 'Thêm ngày lễ' }).click()

    await expect(holidaysPage.toast.filter({ hasText: 'Đã thêm ngày lễ' })).toBeVisible()
    const body = posts[0].body
    expect(body).toMatchObject({ name: 'Giỗ Tổ', categoryId: 1 })
    expect(body.startDate).toMatch(/^\d{4}-\d{2}-20$/)
    expect(body.endDate).toMatch(/^\d{4}-\d{2}-21$/)
    expect(body).not.toHaveProperty('branchIds')
    expect(body).not.toHaveProperty('description')
    await expect(page).toHaveURL(/\/dashboard\/holidays/)
  })

  test('HOL-005 sửa: điền sẵn chi nhánh đã chọn; thêm chi nhánh gửi branchIds số; xoá mô tả thì không gửi', async ({
    api,
    holidaysPage
  }) => {
    await stubPage(api)
    const puts = await api.route('/org/holidays/101', { method: 'PUT', body: ok(LOCAL_DAY) })
    await holidaysPage.goto()

    await holidaysPage.row('Lễ hội E2E').first().getByRole('button', { name: 'Sửa Lễ hội E2E' }).click()
    await expect(holidaysPage.field('Tên ngày lễ')).toHaveValue('Lễ hội E2E')
    await expect(holidaysPage.dialog.getByLabel('Chi nhánh HCM')).toBeChecked()
    await expect(holidaysPage.dialog.getByLabel('Trụ sở')).not.toBeChecked()
    await holidaysPage.dialog.getByLabel('Trụ sở').check()
    await holidaysPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      name: 'Lễ hội E2E',
      categoryId: 9,
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      branchIds: [11, 10]
    })
  })

  test('HOL-006 xem chi tiết và xoá', async ({ page, api, holidaysPage }) => {
    await stubPage(api)
    await api.route('/org/holidays/100', { method: 'GET', body: ok(NATIONAL_DAY) })
    const deletes = await api.route('/org/holidays/100', { method: 'DELETE', body: ok(null) })
    await holidaysPage.goto()

    await holidaysPage.row('Quốc khánh').getByRole('button', { name: 'Xem Quốc khánh' }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toContainText('Số ngày2')
    await expect(sheet).toContainText('Chi nhánh áp dụngTất cả chi nhánh')
    await expect(sheet).toContainText('Nghỉ lễ 2/9')
    await page.keyboard.press('Escape')

    await holidaysPage.row('Quốc khánh').getByRole('button', { name: 'Xoá Quốc khánh' }).click()
    await holidaysPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => deletes.length).toBe(1)
    await expect(holidaysPage.toast.filter({ hasText: 'Đã xoá ngày lễ' })).toBeVisible()
  })

  test('HOL-007 xuất PDF và iCal theo bộ lọc', async ({ page, api, holidaysPage }) => {
    await stubPage(api)
    const pdf = await api.route('/org/holidays/export/pdf', { body: ok(null) })
    const ical = await api.route('/org/holidays/export/ical', { body: ok(null) })
    await holidaysPage.goto('?year=2026&categoryId=1')

    const pdfFile = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất PDF' }).click()
    expect((await pdfFile).suggestedFilename()).toBe('holidays.pdf')
    const icalFile = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất iCal' }).click()
    expect((await icalFile).suggestedFilename()).toBe('holidays.ics')

    for (const call of [pdf[0], ical[0]]) {
      expect(call.query.get('year')).toBe('2026')
      expect(call.query.get('categoryId')).toBe('1')
      expect(call.query.has('page')).toBe(false)
    }
  })

  test('HOL-008 lịch tháng: khoảng 6 tuần từ thứ Hai; ngày lễ nhiều ngày hiện ở từng ngày; mũi tên đổi tháng', async ({
    page,
    api,
    holidaysPage
  }) => {
    await page.clock.setFixedTime(new Date('2026-09-10T09:00:00'))
    const { calendar, list } = await stubPage(api)
    await holidaysPage.goto()

    await page.getByRole('button', { name: 'Xem lịch' }).click()
    await expect(page).toHaveURL(/view=CALENDAR/)
    // Sep 2026 starts on a Tuesday: the grid runs Mon 31/08 → Sun 11/10 (42 days)
    await expect.poll(() => calendar.at(-1)?.query.get('from')).toBe('2026-08-31')
    expect(calendar.at(-1)?.query.get('to')).toBe('2026-10-11')
    const listCalls = list.length

    const grid = holidaysPage.calendar.getByRole('grid')
    await expect(grid.getByRole('gridcell', { name: '01/09/2026' })).toContainText('Quốc khánh')
    await expect(grid.getByRole('gridcell', { name: '02/09/2026' })).toContainText('Quốc khánh')
    await expect(grid.getByRole('gridcell', { name: '03/09/2026' })).not.toContainText('Quốc khánh')
    await expect(holidaysPage.calendar.getByRole('list', { name: 'Chú thích loại ngày lễ' })).toContainText('Quốc gia')

    await holidaysPage.calendar.getByRole('button', { name: 'Sau' }).click()
    await expect.poll(() => calendar.at(-1)?.query.get('from')).toBe('2026-09-28')
    // the list is not fetched while the calendar is shown
    expect(list.length).toBe(listCalls)
  })

  test('HOL-009 lịch tuần / ngày; Hôm nay; bấm ngày lễ mở chi tiết', async ({ page, api, holidaysPage }) => {
    await page.clock.setFixedTime(new Date('2026-09-15T09:00:00'))
    const { calendar } = await stubPage(api)
    await api.route('/org/holidays/101', { method: 'GET', body: ok(LOCAL_DAY) })
    await holidaysPage.goto('?view=CALENDAR')

    await holidaysPage.calendar.getByRole('tab', { name: 'Tuần' }).click()
    await expect.poll(() => calendar.at(-1)?.query.get('from')).toBe('2026-09-14')
    expect(calendar.at(-1)?.query.get('to')).toBe('2026-09-20')

    await holidaysPage.calendar.getByRole('tab', { name: 'Ngày' }).click()
    await expect.poll(() => calendar.at(-1)?.query.get('to')).toBe('2026-09-15')
    await holidaysPage.calendar.getByRole('button', { name: 'Trước' }).click()
    await expect(holidaysPage.calendar).toContainText('Không có ngày lễ trong ngày này.')
    await holidaysPage.calendar.getByRole('button', { name: 'Hôm nay' }).click()

    await holidaysPage.calendar.getByRole('button', { name: 'Lễ hội E2E' }).click()
    await expect(page.getByRole('dialog')).toContainText('Chi nhánh áp dụngChi nhánh HCM')
  })

  test('HOL-010 loại ngày lễ: loại hệ thống chỉ xem; thêm loại riêng gửi {name, color}; xoá khi đang dùng (EMP_010) báo lỗi', async ({
    api,
    holidaysPage
  }) => {
    await stubPage(api)
    const posts = await api.route('/org/holiday-categories', { method: 'POST', body: ok(CATEGORIES[2]) })
    await api.route('/org/holiday-categories/9', {
      method: 'DELETE',
      status: 400,
      body: fail('EMP_010', 'Đang được sử dụng: e2e-sentinel.')
    })
    await holidaysPage.goto()

    await holidaysPage.categoriesButton.click()
    const list = holidaysPage.dialog.getByRole('list', { name: 'Loại ngày lễ' })
    await expect(list.getByRole('listitem').filter({ hasText: 'Quốc gia' })).toContainText('Hệ thống')
    await expect(holidaysPage.dialog.getByRole('button', { name: 'Sửa loại Quốc gia' })).toHaveCount(0)

    await holidaysPage.dialog.getByRole('textbox', { name: 'Thêm loại' }).fill('  Ngày hội SPECOM  ')
    await holidaysPage.dialog.getByLabel('Màu').fill('#123abc')
    await holidaysPage.dialog.getByRole('button', { name: 'Thêm loại' }).click()
    await expect.poll(() => posts[0]?.body).toEqual({ name: 'Ngày hội SPECOM', color: '#123ABC' })

    await holidaysPage.dialog.getByRole('button', { name: 'Xoá loại Lễ hội E2E' }).click()
    await expect(holidaysPage.toast.filter({ hasText: 'Đang được sử dụng: e2e-sentinel.' })).toBeVisible()
  })
})

test('HOL-011 chỉ ORG_VIEW: không có thêm, loại, sửa, xoá; vẫn xem và xuất', async ({
  page,
  api,
  baseURL,
  holidaysPage
}) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubPage(api)

  await holidaysPage.goto()

  await expect(holidaysPage.row('Quốc khánh')).toBeVisible()
  await expect(holidaysPage.addButton).toHaveCount(0)
  await expect(holidaysPage.categoriesButton).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Sửa/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Xem Quốc khánh' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Xuất PDF' })).toBeVisible()
})

test('HOL-012 @smoke super admin: chọn công ty trước; ?companyId= giữ được khi /me chậm; thêm gửi companyId', async ({
  page,
  api,
  baseURL,
  holidaysPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const { list, categories } = await stubPage(api)
  const posts = await api.route('/org/holidays', { method: 'POST', body: ok(NATIONAL_DAY) })

  await holidaysPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý ngày lễ.')).toBeVisible()
  expect(list).toHaveLength(0)

  await holidaysPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  expect(categories.at(-1)?.query.get('companyId')).toBe('2')
  await expect(page).toHaveURL(/companyId=2/)

  await holidaysPage.addButton.click()
  await holidaysPage.field('Tên ngày lễ').fill('Ngày lễ E2E')
  await holidaysPage.choose('Loại', 'Quốc gia', holidaysPage.dialog)
  await holidaysPage.pickDay('Ngày bắt đầu', 10, holidaysPage.dialog)
  await holidaysPage.pickDay('Ngày kết thúc', 10, holidaysPage.dialog)
  await holidaysPage.dialog.getByRole('button', { name: 'Thêm ngày lễ' }).click()
  await expect.poll(() => posts[0]?.query.get('companyId')).toBe('2')
})
