// @ts-check
// Feature: auth / session (401 → refresh → retry, logout). Spec sources: IAM Swagger TokenDto description
// ("FE calls refresh-token on 401"), POST /auth/logout ("always answers 200"), app/configs/axios.config.ts.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_TOKEN, fail, ok } from '../utils/mock-api.js'

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} baseURL
 */
const signIn = (page, baseURL) =>
  page.context().addCookies([
    { name: 'token', value: 'e2e-expired-access', url: baseURL },
    { name: 'refreshToken', value: FAKE_TOKEN.refreshToken, url: baseURL }
  ])

test.describe('Phiên đăng nhập', () => {
  test('AUTH-101 token hết hạn: refresh một lần rồi gọi lại /me bằng token mới', async ({ page, baseURL }) => {
    const meAuthHeaders = []
    let refreshCalls = 0
    await page.route('**/api/v1/me', (route) => {
      const auth = route.request().headers()['authorization']
      meAuthHeaders.push(auth)
      const valid = auth === `Bearer ${FAKE_TOKEN.accessToken}`
      return route.fulfill({
        status: valid ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify(valid ? ok(FAKE_ME) : fail('COMMON_003', 'Unauthorized'))
      })
    })
    await page.route('**/api/v1/auth/refresh-token', (route) => {
      refreshCalls++
      expect(route.request().postDataJSON()).toEqual({ refreshToken: FAKE_TOKEN.refreshToken })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(ok(FAKE_TOKEN)) })
    })
    await signIn(page, String(baseURL))

    await page.goto('/dashboard')

    await expect(page.getByText('Xin chào, e2e.tester')).toBeVisible()
    expect(refreshCalls).toBe(1)
    expect(meAuthHeaders).toEqual(['Bearer e2e-expired-access', `Bearer ${FAKE_TOKEN.accessToken}`])
  })

  test('AUTH-102 refresh token cũng hết hạn: xoá cookie và về trang đăng nhập', async ({ page, api, baseURL }) => {
    await api.route('/me', { status: 401, body: fail('COMMON_003', 'Unauthorized') })
    await api.route('/auth/refresh-token', {
      status: 401,
      body: fail('AUTH_003', 'Refresh token không hợp lệ hoặc đã hết hạn.')
    })
    await signIn(page, String(baseURL))

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login$/)
    const names = (await page.context().cookies()).map((c) => c.name)
    expect(names).not.toContain('token')
    expect(names).not.toContain('refreshToken')
  })

  test('AUTH-103 @smoke đăng xuất: gửi refresh token, xoá cookie, về trang đăng nhập', async ({
    page,
    api,
    baseURL
  }) => {
    await api.route('/me', { body: ok(FAKE_ME) })
    await api.route('/auth/logout', { body: ok(null) })
    await page.context().addCookies([
      { name: 'token', value: FAKE_TOKEN.accessToken, url: String(baseURL) },
      { name: 'refreshToken', value: FAKE_TOKEN.refreshToken, url: String(baseURL) }
    ])
    await page.goto('/dashboard')
    await expect(page.getByText('Xin chào, e2e.tester')).toBeVisible()
    const logoutRequest = page.waitForRequest('**/api/v1/auth/logout')

    await page.getByRole('button', { name: 'Đăng xuất' }).click()

    expect((await logoutRequest).postDataJSON()).toEqual({ refreshToken: FAKE_TOKEN.refreshToken })
    await expect(page).toHaveURL(/\/auth\/login$/)
    expect((await page.context().cookies()).map((c) => c.name)).not.toContain('token')
  })

  test('AUTH-104 đăng xuất vẫn hoàn tất khi API logout lỗi', async ({ page, api, baseURL }) => {
    await api.route('/me', { body: ok(FAKE_ME) })
    await api.route('/auth/logout', { status: 500, body: fail('COMMON_002', 'e2e-sentinel') })
    await signIn(page, String(baseURL))
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Đăng xuất' }).click()

    await expect(page).toHaveURL(/\/auth\/login$/)
    // Logout is silent: no error toast for a failed logout call
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
  })
})
