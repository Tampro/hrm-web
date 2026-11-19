// @ts-check
// Feature: email templates (super admin). Spec sources: hrm-be EmailTemplateController (list, GET /{id},
// PUT /{id}/settings, PUT /{id}/content/{lang}, GET /{id}/preview/{lang}), EmailTemplateService forms, EMAIL_001/002.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'

const BASE = '/settings/admin/email-templates'

const ROW = {
  id: '1',
  code: 'USER_CREATE',
  name: 'User Create',
  fromName: '{app_name}',
  createdDate: '2026-11-18T17:34:13Z',
  updatedDate: null
}
/** a code without a translation key: the backend name is shown */
const UNKNOWN_ROW = { ...ROW, id: '9', code: 'E2E_UNKNOWN', name: 'E2E Unknown Template' }

const DETAIL = {
  template: ROW,
  contents: [
    { lang: 'en', subject: 'Welcome {user_name}', content: '<p>Hello {user_name}</p>', updatedDate: null },
    { lang: 'vi', subject: 'Chào {user_name}', content: '<p>Xin chào {user_name}</p>', updatedDate: null }
  ],
  variables: ['app_name', 'app_url', 'user_name'],
  toggleableByCompany: true
}

test('ET-001 @smoke người không phải super admin: không có menu và không gọi API', async ({
  page,
  api,
  baseURL,
  emailTemplatesPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const calls = await api.route(BASE, { body: ok(pageOf([ROW])) })

  await emailTemplatesPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mẫu email' })).toHaveCount(0)
  expect(calls).toHaveLength(0)
})

test.describe('Mẫu email', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  })

  test('ET-002 @smoke danh sách: tên dịch theo code (code lạ dùng tên backend); tìm kiếm gửi keyword', async ({
    page,
    api,
    emailTemplatesPage
  }) => {
    const calls = await api.route(BASE, { body: ok(pageOf([ROW, UNKNOWN_ROW])) })

    await emailTemplatesPage.goto()

    await expect(page.getByRole('cell', { name: 'Tạo người dùng', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'E2E Unknown Template', exact: true })).toBeVisible()
    await expect(page.getByText('Hiển thị 2 / 2')).toBeVisible()
    expect(calls[0].query.get('page')).toBe('0')

    await emailTemplatesPage.keyword.fill('  welcome  ')
    await emailTemplatesPage.searchButton.click()

    await expect(page).toHaveURL(/keyword=welcome/)
    await expect.poll(() => calls.at(-1)?.query.get('keyword')).toBe('welcome')
  })

  test('ET-003 bấm một dòng mở trang sửa: biến, nhãn "Công ty có thể tắt", nội dung tiếng Việt', async ({
    page,
    api,
    emailTemplatesPage
  }) => {
    await api.route(BASE, { body: ok(pageOf([ROW])) })
    await api.route(`${BASE}/1`, { body: ok(DETAIL) })
    await emailTemplatesPage.goto()

    await page.getByRole('cell', { name: 'Tạo người dùng', exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard\/email-templates\/1$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tạo người dùng')
    await expect(page.getByText('Công ty có thể tắt')).toBeVisible()
    await expect(emailTemplatesPage.fromName).toHaveValue('{app_name}')
    await expect(emailTemplatesPage.subject).toHaveValue('Chào {user_name}')
    await expect(emailTemplatesPage.variables.getByRole('button')).toHaveText([
      '{app_name}',
      '{app_url}',
      '{user_name}'
    ])
  })

  test('ET-004 tên người gửi: bắt buộc; lưu gửi {fromName}', async ({ api, emailTemplatesPage }) => {
    await api.route(`${BASE}/1`, { body: ok(DETAIL) })
    const puts = await api.route(`${BASE}/1/settings`, { method: 'PUT', body: ok(DETAIL) })
    await emailTemplatesPage.goto('1')
    const save = emailTemplatesPage.saveButtonOf(emailTemplatesPage.settingsForm)

    await emailTemplatesPage.fromName.fill('   ')
    await save.click()
    await expect(emailTemplatesPage.settingsForm.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(puts).toHaveLength(0)

    await emailTemplatesPage.fromName.fill('SPECOM {app_name}')
    await save.click()

    await expect(emailTemplatesPage.toast.filter({ hasText: 'Đã lưu cài đặt' })).toBeVisible()
    expect(puts[0].body).toEqual({ fromName: 'SPECOM {app_name}' })
  })

  test('ET-005 nội dung: đổi tab sang tiếng Hàn (chưa có) hiện cảnh báo; lưu gửi tới /content/ko', async ({
    page,
    api,
    emailTemplatesPage
  }) => {
    await api.route(`${BASE}/1`, { body: ok(DETAIL) })
    const puts = await api.route(`${BASE}/1/content/ko`, { method: 'PUT', body: ok(DETAIL) })
    await emailTemplatesPage.goto('1')
    const save = emailTemplatesPage.saveButtonOf(emailTemplatesPage.contentForm)

    await emailTemplatesPage.languageTab('한국어').click()

    await expect(page).toHaveURL(/tab=ko/)
    await expect(page.getByRole('note')).toHaveText(
      'Ngôn ngữ này chưa có nội dung. Khi gửi, hệ thống dùng bản tiếng Anh.'
    )
    await expect(emailTemplatesPage.subject).toHaveValue('')
    await expect(emailTemplatesPage.previewButton).toBeDisabled()

    await emailTemplatesPage.subject.fill('{user_name}님 환영합니다')
    await save.click()
    await expect(emailTemplatesPage.contentForm.getByText('Vui lòng nhập thông tin này')).toBeVisible()
    expect(puts).toHaveLength(0)

    await emailTemplatesPage.content.fill('<p>{user_name}님</p>')
    await save.click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({ subject: '{user_name}님 환영합니다', content: '<p>{user_name}님</p>' })
  })

  test('ET-006 xem trước: tắt khi đang sửa; mở hộp thoại với bản đã lưu, HTML trong iframe sandbox', async ({
    page,
    api,
    emailTemplatesPage
  }) => {
    await api.route(`${BASE}/1`, { body: ok(DETAIL) })
    const previews = await api.route(`${BASE}/1/preview/en`, {
      body: ok({ fromName: 'E2E HRM', subject: 'Welcome [user_name]', html: '<p id="e2e-body">Hello [user_name]</p>' })
    })
    await emailTemplatesPage.goto('1?tab=en')

    await emailTemplatesPage.subject.fill('changed')
    await expect(emailTemplatesPage.previewButton).toBeDisabled()
    await emailTemplatesPage.subject.fill('Welcome {user_name}')
    await expect(emailTemplatesPage.previewButton).toBeEnabled()

    await emailTemplatesPage.previewButton.click()

    await expect(emailTemplatesPage.dialog).toContainText('Welcome [user_name]')
    await expect(emailTemplatesPage.dialog).toContainText('E2E HRM')
    const frame = emailTemplatesPage.dialog.locator('iframe')
    await expect(frame).toHaveAttribute('sandbox', '')
    await expect(page.frameLocator('iframe').locator('#e2e-body')).toHaveText('Hello [user_name]')
    expect(previews).toHaveLength(1)
  })

  test('ET-007 bấm biến sao chép {tên_biến} vào clipboard', async ({ page, context, api, emailTemplatesPage }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await api.route(`${BASE}/1`, { body: ok(DETAIL) })
    await emailTemplatesPage.goto('1')

    await emailTemplatesPage.variables.getByRole('button', { name: 'Sao chép {user_name}' }).click()

    await expect(emailTemplatesPage.toast.filter({ hasText: 'Đã sao chép' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('{user_name}')
  })

  test('ET-008 mẫu không tồn tại (EMAIL_001) hiện thông báo', async ({ page, api, emailTemplatesPage }) => {
    await api.route(`${BASE}/404`, { status: 404, body: fail('EMAIL_001', 'Mẫu email không tồn tại.') })

    await emailTemplatesPage.goto('404')

    await expect(page.locator('main').getByText('Mẫu email không tồn tại.')).toBeVisible()
    await expect(emailTemplatesPage.contentForm).toHaveCount(0)
  })
})
