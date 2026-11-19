// @ts-check
// Feature: award types (manual 6.3.6). Spec sources: hrm-be employee-service AwardTypeController, AwardTypeDtos
// (AwardTypeForm: name ≤ 150, description ≤ 500, icon key), EEmployeeError EMP_011 / EMP_019.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ORG_VIEW', 'ORG_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ORG_VIEW'] }

const STAR = {
  id: '60',
  companyId: '2',
  name: 'Nhân viên xuất sắc tháng',
  description: 'Thành tích nổi bật trong tháng',
  icon: 'star',
  status: 'ACTIVE',
  createdDate: '2026-11-01T02:00:00Z',
  updatedDate: null
}
const OLD = {
  ...STAR,
  id: '61',
  name: 'Sáng kiến cải tiến',
  description: null,
  icon: 'unknown-key',
  status: 'INACTIVE'
}
const NULL_ROW = Object.fromEntries(Object.keys(STAR).map((k) => [k, k === 'id' ? '62' : null]))

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubList = (api, rows = [STAR, OLD, NULL_ROW]) =>
  api.route('/org/award-types', { method: 'GET', body: ok(pageOf(rows)) })

test('AWD-001 @smoke không có ORG_VIEW: không có menu, không gọi API', async ({
  page,
  api,
  baseURL,
  awardTypesPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const list = await stubList(api)

  await awardTypesPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Loại khen thưởng' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Loại khen thưởng · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('AWD-002 @smoke danh sách: tên + mô tả + trạng thái; lọc trạng thái gửi INACTIVE, Tất cả bỏ status; tìm từ khoá', async ({
    page,
    api,
    awardTypesPage
  }) => {
    const list = await stubList(api)
    await awardTypesPage.goto()

    await expect(awardTypesPage.row('Nhân viên xuất sắc tháng')).toContainText('Thành tích nổi bật trong tháng')
    await expect(awardTypesPage.row('Nhân viên xuất sắc tháng')).toContainText('Hoạt động')
    await expect(awardTypesPage.row('Sáng kiến cải tiến')).toContainText('Tạm nghỉ')
    await expect(page.getByText('Hiển thị 3 / 3')).toBeVisible()
    expect(list[0].query.has('status')).toBe(false)
    expect(list[0].query.has('companyId')).toBe(false)

    await awardTypesPage.filterStatus('Tạm nghỉ')
    await expect(page).toHaveURL(/status=INACTIVE/)
    await expect.poll(() => list.at(-1)?.query.get('status')).toBe('INACTIVE')
    await awardTypesPage.filterStatus('Tất cả trạng thái')
    await expect.poll(() => list.at(-1)?.query.has('status')).toBe(false)

    await awardTypesPage.keyword.fill('  xuất sắc ')
    await awardTypesPage.searchButton.click()
    await expect.poll(() => list.at(-1)?.query.get('keyword')).toBe('xuất sắc')
  })

  test('AWD-003 thêm (form bên trái): tên bắt buộc; chọn biểu tượng; POST bỏ mô tả trống, mặc định ACTIVE; form trống lại', async ({
    api,
    awardTypesPage
  }) => {
    const list = await stubList(api)
    const posts = await api.route('/org/award-types', { method: 'POST', body: ok(STAR) })
    await awardTypesPage.goto()
    const form = awardTypesPage.addForm

    await form.getByRole('button', { name: 'Thêm loại khen thưởng' }).click()
    await expect(form.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(posts).toHaveLength(0)

    await form.getByRole('textbox', { name: 'Tên loại khen thưởng' }).fill('  Huy chương đồng đội  ')
    await expect(form.getByRole('radio', { name: 'Biểu tượng trophy' })).toHaveAttribute('aria-checked', 'true')
    await form.getByRole('radio', { name: 'Biểu tượng medal' }).click()
    await form.getByRole('button', { name: 'Thêm loại khen thưởng' }).click()

    await expect(awardTypesPage.toast.filter({ hasText: 'Đã thêm loại khen thưởng' })).toBeVisible()
    expect(posts[0].body).toEqual({ name: 'Huy chương đồng đội', icon: 'medal', status: 'ACTIVE' })
    await expect(form.getByRole('textbox', { name: 'Tên loại khen thưởng' })).toHaveValue('')
    await expect.poll(() => list.length).toBeGreaterThan(1)
  })

  test('AWD-004 sửa: form chuyển sang chế độ sửa, điền sẵn; xoá mô tả thì không gửi; tắt gửi INACTIVE; Huỷ quay về thêm', async ({
    api,
    awardTypesPage
  }) => {
    await stubList(api)
    const puts = await api.route('/org/award-types/60', { method: 'PUT', body: ok(STAR) })
    await awardTypesPage.goto()

    await awardTypesPage
      .row('Nhân viên xuất sắc tháng')
      .getByRole('button', { name: 'Sửa Nhân viên xuất sắc tháng' })
      .click()
    const form = awardTypesPage.editForm
    await expect(form.getByRole('textbox', { name: 'Tên loại khen thưởng' })).toHaveValue('Nhân viên xuất sắc tháng')
    await expect(form.getByRole('radio', { name: 'Biểu tượng star' })).toHaveAttribute('aria-checked', 'true')
    await form.getByRole('textbox', { name: 'Mô tả' }).fill('')
    await form.getByRole('switch', { name: 'Đang hoạt động' }).click()
    await form.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ name: 'Nhân viên xuất sắc tháng', icon: 'star', status: 'INACTIVE' })
    await expect(awardTypesPage.addForm).toBeVisible()

    // an unknown stored icon key falls back to the default
    await awardTypesPage.row('Sáng kiến cải tiến').getByRole('button', { name: 'Sửa Sáng kiến cải tiến' }).click()
    await expect(form.getByRole('radio', { name: 'Biểu tượng trophy' })).toHaveAttribute('aria-checked', 'true')
    await form.getByRole('button', { name: 'Huỷ' }).click()
    await expect(awardTypesPage.addForm).toBeVisible()
  })

  test('AWD-005 tạm ngưng / kích hoạt gửi PUT /status; xoá; tên trùng (EMP_011) báo lỗi', async ({
    api,
    awardTypesPage
  }) => {
    await stubList(api)
    const status60 = await api.route('/org/award-types/60/status', { method: 'PUT', body: ok(STAR) })
    const status61 = await api.route('/org/award-types/61/status', { method: 'PUT', body: ok(OLD) })
    const deletes = await api.route('/org/award-types/61', { method: 'DELETE', body: ok(null) })
    await api.route('/org/award-types', {
      method: 'POST',
      status: 400,
      body: fail('EMP_011', 'Tên đã tồn tại: e2e-sentinel.')
    })
    await awardTypesPage.goto()

    await awardTypesPage.page.getByRole('button', { name: 'Tạm ngưng Nhân viên xuất sắc tháng' }).click()
    await expect.poll(() => status60[0]?.body).toEqual({ status: 'INACTIVE' })
    await awardTypesPage.page.getByRole('button', { name: 'Kích hoạt Sáng kiến cải tiến' }).click()
    await expect.poll(() => status61[0]?.body).toEqual({ status: 'ACTIVE' })

    await awardTypesPage.page.getByRole('button', { name: 'Xoá Sáng kiến cải tiến' }).click()
    await expect(awardTypesPage.alertDialog).toContainText('Xoá loại khen thưởng Sáng kiến cải tiến?')
    await awardTypesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => deletes.length).toBe(1)

    await awardTypesPage.addForm.getByRole('textbox', { name: 'Tên loại khen thưởng' }).fill('Nhân viên xuất sắc tháng')
    await awardTypesPage.addForm.getByRole('button', { name: 'Thêm loại khen thưởng' }).click()
    await expect(awardTypesPage.toast.filter({ hasText: 'Tên đã tồn tại: e2e-sentinel.' })).toBeVisible()
    await expect(awardTypesPage.addForm.getByRole('textbox', { name: 'Tên loại khen thưởng' })).toHaveValue(
      'Nhân viên xuất sắc tháng'
    )
  })
})

test('AWD-006 chỉ ORG_VIEW: không có form và thao tác, chỉ danh sách', async ({
  page,
  api,
  baseURL,
  awardTypesPage
}) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubList(api)

  await awardTypesPage.goto()

  await expect(awardTypesPage.row('Nhân viên xuất sắc tháng')).toBeVisible()
  await expect(awardTypesPage.addForm).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(Sửa|Xoá|Tạm ngưng|Kích hoạt) (Nhân viên|Sáng kiến)/ })).toHaveCount(
    0
  )
})

test('AWD-007 @smoke super admin: chọn công ty trước; ?companyId= giữ khi /me chậm; thêm gửi companyId', async ({
  page,
  api,
  baseURL,
  awardTypesPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const list = await stubList(api)
  const posts = await api.route('/org/award-types', { method: 'POST', body: ok(STAR) })

  await awardTypesPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý loại khen thưởng.')).toBeVisible()
  expect(list).toHaveLength(0)

  await awardTypesPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  await expect(page).toHaveURL(/companyId=2/)

  await awardTypesPage.addForm.getByRole('textbox', { name: 'Tên loại khen thưởng' }).fill('Khen thưởng E2E')
  await awardTypesPage.addForm.getByRole('button', { name: 'Thêm loại khen thưởng' }).click()
  await expect.poll(() => posts[0]?.query.get('companyId')).toBe('2')
})
