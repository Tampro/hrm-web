// @ts-check
// Feature: default UI language. Spec: Korean is the default when the user has not picked a language (request
// 2026-11-25); a saved choice in localStorage "language" still wins. Uses the bare Playwright page on purpose:
// the shared fixture pins every other spec to Vietnamese.
import { expect, test } from '@playwright/test'

test('LANG-001 @smoke chưa chọn ngôn ngữ: giao diện tiếng Hàn, <html lang="ko">, API nhận Accept-Language ko', async ({
  page
}) => {
  const login = page.waitForRequest('**/api/v1/auth/login')
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"result":false,"code":"AUTH_001"}' })
  )
  await page.goto('/auth/login')

  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko')

  await page.getByRole('textbox', { name: '아이디' }).fill('someone')
  await page.getByRole('textbox', { name: '비밀번호' }).fill('wrong-password')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  expect((await login).headers()['accept-language']).toBe('ko')
})

test('LANG-002 đã chọn tiếng Việt trước đó: giữ tiếng Việt', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await page.goto('/auth/login')

  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
})
