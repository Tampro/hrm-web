// @ts-check
// Feature: announcements (manual 6.3.5). Spec sources: hrm-be employee-service AnnouncementController,
// AnnouncementDtos (AnnouncementForm, ETab, TabCounts, Stats), EAnnouncementState, EEmployeeError EMP_040.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, ok, pageOf } from '../utils/mock-api.js'

const MANAGER = { ...FAKE_ME, permissions: ['ANNOUNCEMENT_VIEW', 'ANNOUNCEMENT_MANAGE'] }
const VIEWER = { ...FAKE_ME, permissions: ['ANNOUNCEMENT_VIEW'] }

const CATEGORIES = [
  { id: '1', name: 'General', color: '#546E7A', system: true },
  { id: '3', name: 'Event', color: '#00897B', system: true },
  { id: '9', name: 'Đào tạo E2E', color: '#6D4C41', system: false }
]
const BRANCHES = [{ id: '10', name: 'Trụ sở' }]
const DEPARTMENTS = [{ id: '20', name: 'Kỹ thuật', branchId: '10' }]

const PARTY = {
  id: '50',
  companyId: '2',
  title: 'Tiệc tất niên',
  category: CATEGORIES[1],
  shortDescription: 'Tối thứ Sáu tại sảnh',
  contentPreview: 'Tiệc lúc 18:00, có bốc thăm.',
  content: null,
  startDate: '2026-12-01',
  endDate: '2026-12-31',
  state: 'UPCOMING',
  featured: true,
  highPriority: false,
  companyWide: true,
  branches: [],
  departments: [],
  attachments: [{ fileId: '700', name: 'menu.pdf', mimeType: 'application/pdf', sizeBytes: 1024 }],
  stats: null,
  createdDate: '2026-11-01T02:00:00Z',
  updatedDate: null
}
const POLICY = {
  ...PARTY,
  id: '51',
  title: 'Quy định làm việc từ xa',
  category: CATEGORIES[0],
  shortDescription: null,
  contentPreview: 'Áp dụng từ tháng 12.',
  state: 'ACTIVE',
  featured: false,
  highPriority: true,
  companyWide: false,
  branches: [{ id: '10', name: 'Trụ sở' }],
  departments: [{ id: '20', name: 'Kỹ thuật' }],
  attachments: []
}
const NULL_ROW = Object.fromEntries(Object.keys(PARTY).map((k) => [k, k === 'id' ? '52' : null]))
const PARTY_DETAIL = {
  ...PARTY,
  content: '<p id="e2e-content">Tiệc lúc <b>18:00</b></p>',
  attachments: [
    {
      fileId: '700',
      name: 'menu.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      viewUrl: 'http://localhost:4173/e2e-view',
      downloadUrl: 'http://localhost:4173/e2e-download'
    },
    { fileId: '701', name: 'so-do.png', mimeType: 'image/png', sizeBytes: 2048, viewUrl: null, downloadUrl: null }
  ],
  stats: { totalEmployees: 40, views: 10, viewRate: 25 }
}

/** @param {ReturnType<import('../utils/mock-api.js').mockApi>} api */
const stubPage = async (api, rows = [PARTY, POLICY, NULL_ROW]) => {
  const list = await api.route('/org/announcements', { method: 'GET', body: ok(pageOf(rows)) })
  const counts = await api.route('/org/announcements/tab-counts', {
    body: ok({ all: 3, highPriority: 1, featured: 1, upcoming: 1 })
  })
  await api.route('/org/announcement-categories', { method: 'GET', body: ok(CATEGORIES) })
  await api.route('/org/branches/options', { body: ok(BRANCHES) })
  await api.route('/org/departments/options', { body: ok(DEPARTMENTS) })
  return { list, counts }
}

test('ANN-001 @smoke không có ANNOUNCEMENT_VIEW: không có menu, không gọi API', async ({
  page,
  api,
  baseURL,
  announcementsPage
}) => {
  await api.signIn(String(baseURL), FAKE_ME)
  const { list } = await stubPage(api)

  await announcementsPage.goto()

  await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Thông báo' })).toHaveCount(0)
  expect(list).toHaveLength(0)
})

test.describe('Thông báo · quản lý công ty', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), MANAGER)
  })

  test('ANN-002 @smoke danh sách: thẻ nổi bật / ưu tiên, loại dịch tên, trạng thái, đối tượng, tệp; không gửi tab', async ({
    page,
    api,
    announcementsPage
  }) => {
    const { list } = await stubPage(api)
    await announcementsPage.goto()

    const party = announcementsPage.row('Tiệc tất niên')
    await expect(party).toContainText('Nổi bật')
    await expect(party).toContainText('Sự kiện')
    await expect(party).toContainText('01/12/2026 – 31/12/2026')
    await expect(party).toContainText('Sắp diễn ra')
    await expect(party).toContainText('Toàn công ty')
    await expect(party.getByTitle('1 tệp đính kèm')).toBeVisible()
    const policy = announcementsPage.row('Quy định làm việc từ xa')
    await expect(policy).toContainText('Ưu tiên cao')
    await expect(policy).toContainText('Chung')
    await expect(policy).toContainText('Đang hiệu lực')
    await expect(policy).toContainText('Trụ sở, Kỹ thuật')
    await expect(page.getByText('Hiển thị 3 / 3')).toBeVisible()
    expect(list[0].query.has('tab')).toBe(false)
    expect(list[0].query.has('companyId')).toBe(false)
  })

  test('ANN-003 bộ lọc gửi loại, chi nhánh, phòng ban, khoảng ngày; đếm bộ lọc', async ({ api, announcementsPage }) => {
    const { list } = await stubPage(api)
    await announcementsPage.goto()

    await announcementsPage.choose('Loại', 'Sự kiện')
    await announcementsPage.choose('Chi nhánh', 'Trụ sở')
    await announcementsPage.choose('Phòng ban', 'Kỹ thuật · Trụ sở')
    await announcementsPage.keyword.fill('  tiệc ')
    await announcementsPage.searchButton.click()

    await expect.poll(() => list.at(-1)?.query.get('categoryId')).toBe('3')
    const q = list.at(-1)?.query
    expect(q?.get('branchId')).toBe('10')
    expect(q?.get('departmentId')).toBe('20')
    expect(q?.get('keyword')).toBe('tiệc')
    await expect(announcementsPage.clearButton).toContainText('4')
  })

  test('ANN-004 bảng tin: chuyển chế độ (URL), tab có số đếm, tab gửi tham số, thẻ có Đọc thêm', async ({
    page,
    api,
    announcementsPage
  }) => {
    const { list, counts } = await stubPage(api)
    await announcementsPage.goto()

    await announcementsPage.views.getByRole('button', { name: 'Bảng tin' }).click()
    await expect(page).toHaveURL(/view=DASHBOARD/)
    await expect(page.getByRole('tab', { name: /^Ưu tiên cao/ })).toContainText('1')
    await expect.poll(() => list.at(-1)?.query.get('tab')).toBe('ALL')
    expect(counts.at(-1)?.query.has('tab')).toBe(false)

    const card = page.getByRole('article', { name: 'Tiệc tất niên' })
    await expect(card).toContainText('Tối thứ Sáu tại sảnh')
    await expect(card).toContainText('Tiệc lúc 18:00, có bốc thăm.')

    await page.getByRole('tab', { name: /^Ưu tiên cao/ }).click()
    await expect.poll(() => list.at(-1)?.query.get('tab')).toBe('HIGH_PRIORITY')

    await page.getByRole('link', { name: 'Đọc thêm: Tiệc tất niên' }).click()
    await expect(page).toHaveURL(/\/dashboard\/announcements\/50$/)
  })

  test('ANN-005 thêm: bắt buộc; không có đối tượng bị chặn (EMP_040); xem trước HTML; tải tệp rồi gửi attachmentIds và đối tượng', async ({
    page,
    api,
    announcementsPage
  }) => {
    await stubPage(api)
    const uploads = await api.route('/media/files', { method: 'POST', body: ok([{ id: '800' }]) })
    const posts = await api.route('/org/announcements', { method: 'POST', body: ok(PARTY) })
    await announcementsPage.goto()

    await announcementsPage.addButton.click()
    await announcementsPage.dialog.getByRole('button', { name: 'Tạo thông báo' }).click()
    await expect(announcementsPage.dialog.getByText('Vui lòng nhập thông tin này')).toHaveCount(5)

    await announcementsPage.field('Tiêu đề').fill('  Đào tạo an toàn  ')
    await announcementsPage.choose('Loại', 'Đào tạo E2E', announcementsPage.dialog)
    await announcementsPage.dialog
      .getByRole('textbox', { name: 'Nội dung' })
      .fill('<p id="e2e-p">Học <b>an toàn</b></p>')
    await announcementsPage.dialog.getByRole('button', { name: 'Xem trước' }).click()
    await expect(announcementsPage.dialog.locator('iframe')).toHaveAttribute('sandbox', '')
    await expect(page.frameLocator('iframe[title="Xem trước"]').locator('#e2e-p')).toHaveText('Học an toàn')
    await announcementsPage.dialog.getByRole('button', { name: 'Soạn HTML' }).click()

    await announcementsPage.pickDay('Ngày bắt đầu', 10, announcementsPage.dialog)
    await announcementsPage.pickDay('Ngày kết thúc', 12, announcementsPage.dialog)
    await announcementsPage.dialog.getByRole('switch', { name: 'Thông báo toàn công ty' }).click()
    await announcementsPage.dialog.getByRole('button', { name: 'Tạo thông báo' }).click()
    await expect(
      announcementsPage.dialog.getByText('Chọn ít nhất một chi nhánh hoặc phòng ban, hoặc bật toàn công ty')
    ).toBeVisible()
    expect(posts).toHaveLength(0)

    await announcementsPage.dialog.getByLabel('Kỹ thuật · Trụ sở').check()
    await announcementsPage.dialog.getByRole('switch', { name: 'Ưu tiên cao' }).click()
    await announcementsPage.dialog.locator('input[type=file]').setInputFiles({
      name: 'noi-quy.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 e2e')
    })
    await announcementsPage.dialog.getByRole('button', { name: 'Tạo thông báo' }).click()

    await expect(announcementsPage.toast.filter({ hasText: 'Đã tạo thông báo' })).toBeVisible()
    expect(String(uploads[0].body)).toContain('noi-quy.pdf')
    const body = posts[0].body
    expect(body).toMatchObject({
      title: 'Đào tạo an toàn',
      categoryId: 9,
      content: '<p id="e2e-p">Học <b>an toàn</b></p>',
      attachmentIds: [800],
      featured: false,
      highPriority: true,
      companyWide: false,
      departmentIds: [20]
    })
    expect(body).not.toHaveProperty('branchIds')
    expect(body).not.toHaveProperty('shortDescription')
  })

  test('ANN-006 sửa từ danh sách: tải chi tiết; giữ tệp cũ, bỏ tệp đã xoá; toàn công ty không gửi đối tượng', async ({
    api,
    announcementsPage
  }) => {
    await stubPage(api)
    await api.route('/org/announcements/50', { method: 'GET', body: ok(PARTY_DETAIL) })
    const puts = await api.route('/org/announcements/50', { method: 'PUT', body: ok(PARTY) })
    await announcementsPage.goto()

    await announcementsPage.row('Tiệc tất niên').getByRole('button', { name: 'Sửa Tiệc tất niên' }).click()
    await expect(announcementsPage.field('Tiêu đề')).toHaveValue('Tiệc tất niên')
    await expect(announcementsPage.dialog.getByRole('textbox', { name: 'Nội dung' })).toHaveValue(PARTY_DETAIL.content)
    await announcementsPage.dialog.getByRole('button', { name: 'Bỏ tệp so-do.png' }).click()
    await announcementsPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    await expect.poll(() => puts.length).toBe(1)
    expect(puts[0].body).toEqual({
      title: 'Tiệc tất niên',
      categoryId: 3,
      shortDescription: 'Tối thứ Sáu tại sảnh',
      content: PARTY_DETAIL.content,
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      attachmentIds: [700],
      featured: true,
      highPriority: false,
      companyWide: true
    })
  })

  test('ANN-007 trang chi tiết: tiêu đề, thẻ, nội dung trong iframe sandbox, tệp tải / không có quyền, thanh lượt xem', async ({
    page,
    api,
    announcementsPage
  }) => {
    await api.route('/org/announcements/50', { method: 'GET', body: ok(PARTY_DETAIL) })
    await announcementsPage.goto('/50')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tiệc tất niên')
    const header = page.getByRole('region', { name: 'Thông tin thông báo' })
    await expect(header).toContainText('Nổi bật')
    await expect(header).toContainText('Toàn công ty')
    await expect(page.getByTitle('Nội dung')).toHaveAttribute('sandbox', '')
    await expect(page.frameLocator('iframe[title="Nội dung"]').locator('#e2e-content')).toHaveText('Tiệc lúc 18:00')
    await expect(page.getByRole('link', { name: 'Tải menu.pdf' })).toHaveAttribute('href', /e2e-download/)
    await expect(page.getByRole('listitem').filter({ hasText: 'so-do.png' })).toContainText('Không có quyền tải')
    await expect(page.getByRole('progressbar', { name: 'Tỷ lệ xem' })).toHaveAttribute('aria-valuenow', '25')
    await expect(page.getByText('10 / 40 nhân viên đã xem')).toBeVisible()

    await page.getByRole('link', { name: 'Xem thống kê chi tiết' }).click()
    await expect(page).toHaveURL(/\/dashboard\/announcements\/50\/statistics$/)
  })

  test('ANN-008 trang thống kê: 3 thẻ số liệu và tóm tắt đối tượng', async ({ page, api, announcementsPage }) => {
    await api.route('/org/announcements/51/statistics', {
      body: ok({ ...POLICY, stats: { totalEmployees: 120, views: 45, viewRate: 37.5 } })
    })
    await announcementsPage.goto('/51/statistics')

    const cards = page.getByRole('region', { name: 'Thống kê thông báo' })
    await expect(cards).toContainText('Tổng nhân viên120')
    await expect(cards).toContainText('Lượt xem45')
    await expect(cards).toContainText('Tỷ lệ xem37,5%')
    const summary = page.getByRole('region', { name: 'Tóm tắt thông báo' })
    await expect(summary).toContainText('Chi nhánh nhậnTrụ sở')
    await expect(summary).toContainText('Phòng ban nhậnKỹ thuật')
    await expect(summary).toContainText('Ưu tiên cao')
  })

  test('ANN-009 xoá; loại thông báo: loại hệ thống chỉ xem, thêm loại riêng', async ({ api, announcementsPage }) => {
    await stubPage(api)
    const deletes = await api.route('/org/announcements/51', { method: 'DELETE', body: ok(null) })
    const categoryPosts = await api.route('/org/announcement-categories', { method: 'POST', body: ok(CATEGORIES[2]) })
    await announcementsPage.goto()

    await announcementsPage.row('Quy định làm việc từ xa').getByRole('button', { name: /^Xoá/ }).click()
    await announcementsPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()
    await expect.poll(() => deletes.length).toBe(1)

    await announcementsPage.categoriesButton.click()
    await expect(announcementsPage.dialog.getByRole('listitem').filter({ hasText: 'Sự kiện' })).toContainText(
      'Hệ thống'
    )
    await expect(announcementsPage.dialog.getByRole('button', { name: 'Sửa loại Sự kiện' })).toHaveCount(0)
    await announcementsPage.dialog.getByRole('textbox', { name: 'Thêm loại' }).fill('Tin nội bộ')
    await announcementsPage.dialog.getByRole('button', { name: 'Thêm loại' }).click()
    await expect.poll(() => categoryPosts[0]?.body).toEqual({ name: 'Tin nội bộ', color: '#FB8C00' })
  })
})

test('ANN-010 chỉ ANNOUNCEMENT_VIEW: không thêm / sửa / xoá / loại; vẫn xem và thống kê', async ({
  page,
  api,
  baseURL,
  announcementsPage
}) => {
  await api.signIn(String(baseURL), VIEWER)
  await stubPage(api)

  await announcementsPage.goto()

  await expect(announcementsPage.row('Tiệc tất niên')).toBeVisible()
  await expect(announcementsPage.addButton).toHaveCount(0)
  await expect(announcementsPage.categoriesButton).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Sửa/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Xoá Tiệc/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Thống kê Tiệc tất niên' })).toBeVisible()
})

test('ANN-011 @smoke super admin: chọn công ty trước; ?companyId= giữ khi /me chậm; danh sách gửi companyId', async ({
  page,
  api,
  baseURL,
  announcementsPage
}) => {
  await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_SUPER_ADMIN)) })
  })
  await api.route('/iam/companies', { body: ok(pageOf([{ id: '2', code: 'E2ECO', name: 'E2E Company' }])) })
  const { list } = await stubPage(api)

  await announcementsPage.goto()
  await expect(page.getByText('Chọn công ty để xem và quản lý thông báo.')).toBeVisible()
  expect(list).toHaveLength(0)

  await announcementsPage.goto('?companyId=2')
  await expect.poll(() => list.at(-1)?.query.get('companyId')).toBe('2')
  await expect(page).toHaveURL(/companyId=2/)
})
