// @ts-check
// Feature: auth / login. Spec sources: IAM Swagger (POST /auth/login, LoginForm max 100/128),
// hrm-be messages_vi.properties (AUTH_001), app/helpers/auth.helper.ts (route guards).
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_TOKEN, fail, ok } from '../utils/mock-api.js'

test.describe('Đăng nhập', () => {
  test('AUTH-001 @smoke chưa đăng nhập vào /dashboard thì bị chuyển về trang đăng nhập', async ({
    page,
    loginPage
  }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login$/)
    await expect(loginPage.submit).toBeVisible()
  })

  test('AUTH-002 bỏ trống cả hai ô thì báo lỗi bắt buộc và không gọi API', async ({ page, loginPage }) => {
    let loginCalls = 0
    await page.route('**/api/v1/auth/login', (route) => {
      loginCalls++
      return route.abort()
    })
    await loginPage.goto()

    await loginPage.submit.click()

    await expect(page.getByText('Vui lòng nhập thông tin này')).toHaveCount(2)
    await expect(page).toHaveURL(/\/auth\/login$/)
    expect(loginCalls).toBe(0)
  })

  test('AUTH-003 tên đăng nhập chỉ có khoảng trắng bị coi là bỏ trống', async ({ page, loginPage }) => {
    await loginPage.goto()

    await loginPage.username.fill('   ')
    await loginPage.password.fill('any-password')
    await loginPage.submit.click()

    await expect(page.getByText('Vui lòng nhập thông tin này')).toHaveCount(1)
  })

  test('AUTH-004 biên độ dài: 100 ký tự hợp lệ, 101 ký tự bị chặn', async ({ page, loginPage }) => {
    await loginPage.goto()

    await loginPage.username.fill('a'.repeat(100))
    await expect(page.getByText('Tối đa 100 ký tự')).toHaveCount(0)

    await loginPage.username.fill('a'.repeat(101))
    await expect(page.getByText('Tối đa 100 ký tự')).toBeVisible()
  })

  test('AUTH-005 nút mắt hiện và ẩn mật khẩu', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.password.fill('secret-value')
    await expect(loginPage.password).toHaveAttribute('type', 'password')

    await loginPage.togglePassword.click()
    await expect(loginPage.password).toHaveAttribute('type', 'text')

    await loginPage.togglePassword.click()
    await expect(loginPage.password).toHaveAttribute('type', 'password')
  })

  test('AUTH-006 sai thông tin đăng nhập hiện thông báo của backend và ở lại trang', async ({
    page,
    loginPage,
    api
  }) => {
    await api.route('/auth/login', {
      status: 401,
      body: fail('AUTH_001', 'Tên đăng nhập hoặc mật khẩu không đúng.')
    })
    await loginPage.goto()

    await loginPage.login('e2e.wrong', 'wrong-password')

    await expect(loginPage.toast).toContainText('Tên đăng nhập hoặc mật khẩu không đúng.')
    await expect(page).toHaveURL(/\/auth\/login$/)
    const cookies = await page.context().cookies()
    expect(cookies.map((c) => c.name)).not.toContain('token')
  })

  test('AUTH-007 server lỗi 500 hiện thông báo, không chuyển trang', async ({ page, loginPage, api }) => {
    await api.route('/auth/login', { status: 500, body: fail('COMMON_002', 'Lỗi hệ thống e2e-sentinel') })
    await loginPage.goto()

    await loginPage.login('e2e.tester', 'any-password')

    await expect(loginPage.toast).toContainText('Lỗi hệ thống e2e-sentinel')
    await expect(page).toHaveURL(/\/auth\/login$/)
  })

  test('AUTH-008 @smoke đăng nhập thành công: lưu token, vào dashboard và hiện tên người dùng', async ({
    page,
    loginPage,
    api
  }) => {
    // TODO(assumption): mocked because the seeded accounts still have temporary passwords (AUTH_004)
    await api.route('/auth/login', { body: ok(FAKE_TOKEN) })
    await api.route('/me', { body: ok(FAKE_ME) })
    const loginRequest = page.waitForRequest('**/api/v1/auth/login')
    await loginPage.goto()

    await loginPage.login('  e2e.tester  ', 'any-password')

    const body = (await loginRequest).postDataJSON()
    expect(body).toEqual({ username: 'e2e.tester', password: 'any-password' })
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Xin chào, e2e.tester')).toBeVisible()
    const names = (await page.context().cookies()).map((c) => c.name)
    expect(names).toEqual(expect.arrayContaining(['token', 'refreshToken']))
  })

  test('AUTH-009 đã đăng nhập thì mở trang đăng nhập bị chuyển vào dashboard', async ({ page, api, baseURL }) => {
    await api.route('/me', { body: ok(FAKE_ME) })
    await page.context().addCookies([{ name: 'token', value: FAKE_TOKEN.accessToken, url: baseURL }])

    await page.goto('/auth/login')

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
