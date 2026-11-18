// @ts-check
// Feature: companies / list (manual 3.2.1). Spec sources: IAM Swagger GET /iam/companies (keyword, createdFrom,
// createdTo, status ACTIVE|SUSPENDED, page zero-based) and GET /iam/companies/status-counts; hrm-be
// CompanyDtos.StatusCountsDto(all, active, inactive); CompanyController @PreAuthorize superAdmin.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'
import { COMPANY_ACTIVE, COMPANY_ALL_NULL, COMPANY_SUSPENDED, COUNTS } from './data.js'

test.describe('Công ty · danh sách', () => {
  test('CMP-001 @smoke người không phải super admin: không có menu Công ty và không gọi API danh sách', async ({
    page,
    api,
    baseURL,
    companiesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_ME)
    const listCalls = await api.route('/iam/companies', { body: ok(pageOf([COMPANY_ACTIVE])) })

    await companiesPage.goto()

    await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
    await expect(companiesPage.sidebarCompanies).toHaveCount(0)
    expect(listCalls).toHaveLength(0)
  })

  test('CMP-002 @smoke super admin thấy danh sách, số lượng theo tab và tổng số dòng', async ({
    api,
    baseURL,
    companiesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    const listCalls = await api.route('/iam/companies', {
      body: ok(pageOf([COMPANY_ACTIVE, COMPANY_SUSPENDED], { totalElements: 12 }))
    })
    await api.route('/iam/companies/status-counts', { body: ok({ all: 12, active: 9, inactive: 3 }) })

    await companiesPage.goto()

    await expect(companiesPage.sidebarCompanies).toBeVisible()
    await expect(companiesPage.rows).toHaveCount(2)
    const alpha = companiesPage.row('E2E Alpha Co')
    await expect(alpha).toContainText('alpha@e2e.invalid')
    await expect(alpha).toContainText('E2E_ALPHA')
    await expect(alpha).toContainText('Pro')
    await expect(alpha).toContainText('Hoạt động')
    await expect(alpha).toContainText('02/11/2026')
    await expect(companiesPage.row('E2E Beta Co')).toContainText('Tạm khoá')
    await expect(companiesPage.showing).toHaveText('Hiển thị 2 / 12')
    await expect(companiesPage.tab('Tất cả')).toContainText('12')
    await expect(companiesPage.tab('Hoạt động')).toContainText('9')
    await expect(companiesPage.tab('Tạm khoá')).toContainText('3')
    // first page is zero-based on the API, default size 10, no status (= All)
    const first = listCalls[0].query
    expect(first.get('page')).toBe('0')
    expect(first.get('size')).toBe('10')
    expect(first.has('status')).toBe(false)
  })

  test('CMP-003 tìm theo từ khoá: gửi keyword đã trim, về trang đầu, giữ lại sau F5', async ({
    page,
    api,
    baseURL,
    companiesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    const listCalls = await api.route('/iam/companies', { body: ok(pageOf([COMPANY_ACTIVE])) })
    const countCalls = await api.route('/iam/companies/status-counts', { body: ok(COUNTS) })
    await companiesPage.goto('?page=3')

    await companiesPage.keyword.fill('  alpha  ')
    await companiesPage.searchButton.click()

    await expect(page).toHaveURL(/keyword=alpha/)
    await expect.poll(() => listCalls.at(-1)?.query.get('keyword')).toBe('alpha')
    expect(listCalls.at(-1)?.query.get('page')).toBe('0')
    // list and counts are separate queries fired together: their order is not fixed
    await expect.poll(() => countCalls.at(-1)?.query.get('keyword')).toBe('alpha')
    await expect(companiesPage.searchButton).toContainText('1')

    await page.reload()

    await expect(companiesPage.keyword).toHaveValue('alpha')
    await expect.poll(() => listCalls.at(-1)?.query.get('keyword')).toBe('alpha')
  })

  test('CMP-004 tab Tạm khoá gửi status=SUSPENDED, tab Tất cả không gửi status', async ({
    page,
    api,
    baseURL,
    companiesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    const listCalls = await api.route('/iam/companies', {
      body: (req) => ok(pageOf(req.query.get('status') === 'SUSPENDED' ? [COMPANY_SUSPENDED] : [COMPANY_ACTIVE]))
    })
    await api.route('/iam/companies/status-counts', { body: ok(COUNTS) })
    await companiesPage.goto()
    await expect(companiesPage.rows).toHaveCount(1)

    await companiesPage.tab('Tạm khoá').click()

    await expect(page).toHaveURL(/tab=SUSPENDED/)
    await expect(companiesPage.row('E2E Beta Co')).toBeVisible()
    expect(listCalls.at(-1)?.query.get('status')).toBe('SUSPENDED')

    await companiesPage.tab('Tất cả').click()

    await expect(companiesPage.row('E2E Alpha Co')).toBeVisible()
    expect(listCalls.at(-1)?.query.has('status')).toBe(false)
  })

  test('CMP-005 lọc ngày tạo từ URL được gửi đúng định dạng YYYY-MM-DD và xoá bộ lọc đưa về mặc định', async ({
    page,
    api,
    baseURL,
    companiesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    const listCalls = await api.route('/iam/companies', { body: ok(pageOf([COMPANY_ACTIVE])) })
    await api.route('/iam/companies/status-counts', { body: ok(COUNTS) })

    await companiesPage.goto('?createdFrom=2026-11-01&createdTo=2026-11-30&keyword=alpha')

    await expect.poll(() => listCalls.at(-1)?.query.get('createdFrom')).toBe('2026-11-01')
    expect(listCalls.at(-1)?.query.get('createdTo')).toBe('2026-11-30')
    await expect(page.getByLabel('Tạo từ ngày')).toHaveText(/01\/11\/2026/)
    await expect(companiesPage.searchButton).toContainText('3')

    await companiesPage.clearButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.has('createdFrom')).toBe(false)
    expect(listCalls.at(-1)?.query.has('keyword')).toBe(false)
    await expect(companiesPage.keyword).toHaveValue('')
    await expect(page).not.toHaveURL(/createdFrom|keyword/)
  })

  test('CMP-006 đổi trang gửi page zero-based và cập nhật URL', async ({ page, api, baseURL, companiesPage }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    const listCalls = await api.route('/iam/companies', {
      body: (req) => ok(pageOf([COMPANY_ACTIVE], { page: Number(req.query.get('page')), size: 10, totalElements: 25 }))
    })
    await api.route('/iam/companies/status-counts', { body: ok(COUNTS) })
    await companiesPage.goto()
    await expect(companiesPage.rows).toHaveCount(1)

    await page.getByRole('button', { name: '2', exact: true }).click()

    await expect(page).toHaveURL(/page=2/)
    await expect.poll(() => listCalls.at(-1)?.query.get('page')).toBe('1')
    await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
  })

  test('CMP-007 danh sách rỗng hiện thông báo trống', async ({ api, baseURL, companiesPage }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/iam/companies', { body: ok(pageOf([])) })
    await api.route('/iam/companies/status-counts', { body: ok({ all: 0, active: 0, inactive: 0 }) })

    await companiesPage.goto()

    await expect(companiesPage.table).toContainText('Chưa có công ty nào')
    await expect(companiesPage.showing).toHaveText('Hiển thị 0 / 0')
  })

  test('CMP-008 lỗi 500 khi tải danh sách: hiện message của backend, bảng không vỡ', async ({
    api,
    baseURL,
    companiesPage
  }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/iam/companies', { status: 500, body: fail('COMMON_002', 'Lỗi hệ thống e2e-sentinel') })
    await api.route('/iam/companies/status-counts', { body: ok(COUNTS) })

    await companiesPage.goto()

    await expect(companiesPage.toast).toContainText('Lỗi hệ thống e2e-sentinel')
    await expect(companiesPage.table).toContainText('Chưa có công ty nào')
  })

  test('CMP-009 dòng có mọi field null hiển thị "-" và không làm hỏng trang', async ({
    page,
    api,
    baseURL,
    companiesPage
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/iam/companies', { body: ok(pageOf([COMPANY_ALL_NULL])) })
    await api.route('/iam/companies/status-counts', { body: ok({ all: null, active: null, inactive: null }) })

    await companiesPage.goto()

    await expect(companiesPage.rows).toHaveCount(1)
    await expect(companiesPage.rows.first().getByRole('cell').first()).toContainText('-')
    await expect(companiesPage.rows.first()).not.toContainText('NaN')
    await expect(companiesPage.rows.first()).not.toContainText('Invalid')
    expect(errors).toEqual([])
  })
})
