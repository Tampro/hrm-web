// @ts-check
// Feature: companies — backend contract tests against the real IAM (project "api").
// Authorised checks use HRM_SUPERADMIN_* (loaded from .env by playwright.config.js) and only READ data.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, loginSuperAdmin, MISSING_SUPERADMIN } from '../utils/credentials.js'

test.describe('IAM companies API', () => {
  test('CMP-API-001 danh sách công ty không có token → 401 COMMON_003', async ({ request }) => {
    const res = await request.get('iam/companies')

    expect(res.status()).toBe(401)
    expect((await res.json()).code).toBe('COMMON_003')
  })

  test('CMP-API-002 status-counts không có token → 401', async ({ request }) => {
    const res = await request.get('iam/companies/status-counts')

    expect(res.status()).toBe(401)
  })
})

test.describe('IAM companies API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
  // one worker, one login: parallel workers each logging in at once got intermittent AUTH_001 (2026-11-19)
  test.describe.configure({ mode: 'serial' })

  /** @type {Record<string, string>} */
  let auth = {}
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({
      baseURL: process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
    })
    auth = { Authorization: `Bearer ${await loginSuperAdmin(request)}` }
    await request.dispose()
  })

  test('CMP-API-010 /me của super admin có superAdmin = true', async ({ request }) => {
    const res = await request.get('me', { headers: auth })

    expect(res.status()).toBe(200)
    expect((await res.json()).data.superAdmin).toBe(true)
  })

  test('CMP-API-011 danh sách: envelope + ResponseListDto, page zero-based, size tôn trọng', async ({ request }) => {
    const res = await request.get('iam/companies', { headers: auth, params: { page: 0, size: 5 } })

    expect(res.status()).toBe(200)
    const { result, data } = await res.json()
    expect(result).toBe(true)
    expect(data).toEqual(
      expect.objectContaining({
        content: expect.any(Array),
        page: 0,
        size: 5,
        totalElements: expect.any(Number),
        totalPages: expect.any(Number),
        last: expect.any(Boolean)
      })
    )
    expect(data.content.length).toBeLessThanOrEqual(5)
    for (const company of data.content) {
      expect(['ACTIVE', 'SUSPENDED']).toContain(company.status)
      expect(typeof company.id).toBe('string')
    }
  })

  test('CMP-API-012 status-counts trả {all, active, inactive} (Swagger hiển thị sai schema)', async ({ request }) => {
    const res = await request.get('iam/companies/status-counts', { headers: auth })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(Object.keys(data).sort()).toEqual(['active', 'all', 'inactive'])
    expect(data.all).toBe(data.active + data.inactive)
  })

  test('CMP-API-013 lọc status=SUSPENDED chỉ trả công ty tạm khoá', async ({ request }) => {
    const res = await request.get('iam/companies', { headers: auth, params: { status: 'SUSPENDED', size: 50 } })

    expect(res.status()).toBe(200)
    for (const company of (await res.json()).data.content) expect(company.status).toBe('SUSPENDED')
  })

  test('CMP-API-014 status=ALL không được gây lỗi 500 (team rule: BE nhận ALL = không lọc)', async ({ request }) => {
    // Known BE bug (2026-11-19): returns HTTP 500. The FE omits the param meanwhile (TODO in companies/index.tsx).
    test.fail(true, 'BE bug: GET /iam/companies?status=ALL → 500 — remove this line once fixed')
    const res = await request.get('iam/companies', { headers: auth, params: { status: 'ALL' } })

    expect([200, 400]).toContain(res.status())
  })

  test('CMP-API-015 danh sách gói admin trả mảng PlanDto', async ({ request }) => {
    const res = await request.get('saas/admin/plans', { headers: auth })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(Array.isArray(data)).toBe(true)
    for (const plan of data) expect(plan).toEqual(expect.objectContaining({ id: expect.any(String) }))
  })
})
