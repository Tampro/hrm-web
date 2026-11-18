// @ts-check
// Feature: auth — backend contract tests against the real IAM (project "api", baseURL = E2E_API_URL).
// Only scenarios reachable without a real account: they never create data and never need a password.
import { expect, test } from '@playwright/test'

/** @param {import('@playwright/test').APIResponse} res */
const expectEnvelope = async (res) => {
  expect(res.headers()['content-type']).toContain('application/json')
  const body = await res.json()
  expect(body).toEqual(expect.objectContaining({ result: expect.any(Boolean), code: expect.any(String) }))
  return body
}

test.describe('IAM auth API', () => {
  test('AUTH-API-001 sai mật khẩu → 401 AUTH_001, message theo Accept-Language', async ({ request }) => {
    const res = await request.post('auth/login', { data: { username: 'e2e.nobody', password: 'wrong-password' } })

    expect(res.status()).toBe(401)
    const body = await expectEnvelope(res)
    expect(body.result).toBe(false)
    expect(body.code).toBe('AUTH_001')
    expect(body.message).toBe('Tên đăng nhập hoặc mật khẩu không đúng.')
  })

  test('AUTH-API-002 thiếu trường bắt buộc → 400 COMMON_001 kèm lỗi theo field', async ({ request }) => {
    const res = await request.post('auth/login', { data: { username: '' } })

    expect(res.status()).toBe(400)
    const body = await expectEnvelope(res)
    expect(body.code).toBe('COMMON_001')
    expect(Object.keys(body.data ?? {})).toEqual(expect.arrayContaining(['password']))
  })

  test('AUTH-API-003 refresh token không hợp lệ → 401 AUTH_003', async ({ request }) => {
    const res = await request.post('auth/refresh-token', { data: { refreshToken: 'e2e-invalid-refresh' } })

    expect(res.status()).toBe(401)
    expect((await expectEnvelope(res)).code).toBe('AUTH_003')
  })

  test('AUTH-API-004 logout luôn trả 200 kể cả refresh token rác', async ({ request }) => {
    const res = await request.post('auth/logout', { data: { refreshToken: 'e2e-invalid-refresh' } })

    expect(res.status()).toBe(200)
  })

  test('AUTH-API-005 /me không có token → 401', async ({ request }) => {
    const res = await request.get('me')

    expect(res.status()).toBe(401)
  })
})
