// @ts-check
// Feature: document types (manual 6.3.7). Spec sources: hrm-be employee-service DocumentTypeController,
// DocumentTypeDtos (DocumentTypeForm, RequiredForm), EEmployeeError EMP_010 / EMP_011 / EMP_021.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ORG_VIEW', 'ORG_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ORG_VIEW'] }

const IDENTITY = {
  id: '1',
  name: 'Identity Proof',
  description: 'ID card or passport',
  required: true,
  system: true,
  defaultSlot: true,
  createdDate: '2026-11-18T18:50:50Z',
  updatedDate: null
}
const PERMIT = {
  ...IDENTITY,
  id: '40',
  name: 'Giấy phép lao động',
  description: 'Cho nhân viên nước ngoài',
  required: false,
  system: false,
  defaultSlot: false
}
const NULL_ROW = Object.fromEntries(Object.keys(PERMIT).map((k) => [k, k === 'id' ? '41' : null]))

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubList = (api, rows = [IDENTITY, PERMIT, NULL_ROW]) =>
  api.route('/org/document-types', { method: 'GET', body: ok(pageOf(rows)) })

test('DOC-001 @smoke không có ORG_VIEW: không có menu, không gọi API', async ({
  page,
  api,
  baseURL,
  documentTypesPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const list = await stubList(api)

  await documentTypesPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Loại tài liệu' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Loại tài liệu · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('DOC-002 @smoke danh sách: Bắt buộc / Không bắt buộc, nhãn hệ thống; lọc gửi required=true/false, Tất cả bỏ', async ({
    page,
    api,
    documentTypesPage
  }) => {
    const list = await stubList(api)
    await documentTypesPage.goto()

    await expect(documentTypesPage.row('Identity Proof')).toContainText('Hệ thống')
    await expect(documentTypesPage.row('Identity Proof')).toContainText('Bắt buộc')
    await expect(documentTypesPage.row('Giấy phép lao động')).toContainText('Không bắt buộc')
    await expect(documentTypesPage.row('Giấy phép lao động')).toContainText('Cho nhân viên nước ngoài')
    // system types cannot be deleted
    await expect(page.getByRole('button', { name: 'Xoá Identity Proof' })).toHaveCount(0)
    await expect(page.getByText('Hiển thị 3 / 3')).toBeVisible()
    expect(list[0].query.has('required')).toBe(false)

    await documentTypesPage.filterRequired('Không bắt buộc')
    await expect(page).toHaveURL(/required=false/)
    await expect.poll(() => list.at(-1)?.query.get('required')).toBe('false')
    await documentTypesPage.filterRequired('Bắt buộc')
    await expect.poll(() => list.at(-1)?.query.get('required')).toBe('true')
    await documentTypesPage.filterRequired('Tất cả')
    await expect.poll(() => list.at(-1)?.query.has('required')).toBe(false)
  })

  test('DOC-003 thêm: tên bắt buộc; POST {name, required} bỏ mô tả trống; mặc định Không bắt buộc', async ({
    api,
    documentTypesPage
  }) => {
    await stubList(api)
    const posts = await api.route('/org/document-types', { method: 'POST', body: ok(PERMIT) })
    await documentTypesPage.goto()
    const form = documentTypesPage.addForm

    await form.getByRole('button', { name: 'Thêm loại tài liệu' }).click()
    await expect(form.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(posts).toHaveLength(0)

    await form.getByRole('textbox', { name: 'Tên loại tài liệu' }).fill('  Hộ chiếu  ')
    await expect(form.getByRole('radio', { name: 'Không bắt buộc' })).toBeChecked()
    await form.getByRole('radio', { name: 'Bắt buộc', exact: true }).check()
    await form.getByRole('button', { name: 'Thêm loại tài liệu' }).click()

    await expect(documentTypesPage.toast.filter({ hasText: 'Đã thêm loại tài liệu' })).toBeVisible()
    expect(posts[0].body).toEqual({ name: 'Hộ chiếu', required: true })
    await expect(form.getByRole('textbox', { name: 'Tên loại tài liệu' })).toHaveValue('')
  })

  test('DOC-004 sửa loại riêng: PUT thay toàn bộ, xoá mô tả thì không gửi', async ({ api, documentTypesPage }) => {
    await stubList(api)
    const puts = await api.route('/org/document-types/40', { method: 'PUT', body: ok(PERMIT) })
    await documentTypesPage.goto()

    await documentTypesPage.page.getByRole('button', { name: 'Sửa Giấy phép lao động' }).click()
    const form = documentTypesPage.editForm
    await expect(form.getByRole('textbox', { name: 'Tên loại tài liệu' })).toHaveValue('Giấy phép lao động')
    await form.getByRole('textbox', { name: 'Mô tả' }).fill('')
    await form.getByRole('radio', { name: 'Bắt buộc', exact: true }).check()
    await form.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ name: 'Giấy phép lao động', required: true })
    await expect(documentTypesPage.addForm).toBeVisible()
  })

  test('DOC-005 sửa loại hệ thống: tên khoá, chỉ đổi Bắt buộc qua PUT /required (không gọi PUT thay toàn bộ)', async ({
    api,
    documentTypesPage
  }) => {
    await stubList(api)
    const requiredPuts = await api.route('/org/document-types/1/required', { method: 'PUT', body: ok(IDENTITY) })
    const fullPuts = await api.route('/org/document-types/1', { method: 'PUT', body: ok(IDENTITY) })
    await documentTypesPage.goto()

    await documentTypesPage.page.getByRole('button', { name: 'Sửa Identity Proof' }).click()
    const form = documentTypesPage.editForm
    await expect(form).toContainText('Loại hệ thống dùng chung')
    await expect(form.getByRole('textbox', { name: 'Tên loại tài liệu' })).toBeDisabled()
    await form.getByRole('radio', { name: 'Không bắt buộc' }).check()
    await form.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => requiredPuts[0]?.body).toEqual({ required: false })
    expect(fullPuts).toHaveLength(0)
  })

  test('DOC-006 xoá khi đang dùng (EMP_010) hiện lỗi; tên trùng (EMP_011) khi thêm', async ({
    api,
    documentTypesPage
  }) => {
    await stubList(api)
    await api.route('/org/document-types/40', {
      method: 'DELETE',
      status: 400,
      body: fail('EMP_010', 'Đang được sử dụng: e2e-sentinel.')
    })
    await api.route('/org/document-types', {
      method: 'POST',
      status: 400,
      body: fail('EMP_011', 'Tên đã tồn tại: e2e-sentinel.')
    })
    await documentTypesPage.goto()

    await documentTypesPage.page.getByRole('button', { name: 'Xoá Giấy phép lao động' }).click()
    await documentTypesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect(documentTypesPage.toast.filter({ hasText: 'Đang được sử dụng: e2e-sentinel.' })).toBeVisible()
    await documentTypesPage.alertDialog.getByRole('button', { name: 'Huỷ' }).click()

    await documentTypesPage.addForm.getByRole('textbox', { name: 'Tên loại tài liệu' }).fill('Identity Proof')
    await documentTypesPage.addForm.getByRole('button', { name: 'Thêm loại tài liệu' }).click()
    await expect(documentTypesPage.toast.filter({ hasText: 'Tên đã tồn tại: e2e-sentinel.' })).toBeVisible()
  })
})

test('DOC-007 chỉ ORG_VIEW: không có form và thao tác', async ({ page, api, baseURL, documentTypesPage }) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubList(api)

  await documentTypesPage.goto()

  await expect(documentTypesPage.row('Identity Proof')).toBeVisible()
  await expect(documentTypesPage.addForm).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(Sửa|Xoá) (Identity|Giấy)/ })).toHaveCount(0)
})

test('DOC-008 @smoke super admin: chọn công ty trước; loại hệ thống đổi Bắt buộc gửi companyId', async ({
  page,
  api,
  baseURL,
  documentTypesPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const list = await stubList(api)
  const requiredPuts = await api.route('/org/document-types/1/required', { method: 'PUT', body: ok(IDENTITY) })

  await documentTypesPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý loại tài liệu.')).toBeVisible()
  expect(list).toHaveLength(0)

  await documentTypesPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')

  // Spec: EMP_019 — a system type's Required needs the company of a super admin
  await page.getByRole('button', { name: 'Sửa Identity Proof' }).click()
  await documentTypesPage.editForm.getByRole('radio', { name: 'Không bắt buộc' }).check()
  await documentTypesPage.editForm.getByRole('button', { name: 'Lưu' }).click()
  await expect.poll(() => requiredPuts[0]?.query.get('companyId')).toBe('2')
})
