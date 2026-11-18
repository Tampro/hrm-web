// @ts-check
// Feature: currencies — backend contract tests against the real IAM (project "api", token from the setup project).
// Read-only. Spec sources: hrm-be CurrencyController, CurrencyService (CurrencyDto, exactly one default).
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.describe('SaaS currencies API', () => {
  test('CUR-API-001 danh sách admin không có token → 401', async ({ request }) => {
    expect((await request.get('saas/admin/currencies')).status()).toBe(401)
  })
})

test.describe('SaaS currencies API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  // token of the single real login done by the setup project
  test.beforeAll(() => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
  })

  test('CUR-API-010 danh sách: ResponseListDto<CurrencyDto>, mã 3 chữ in hoa', async ({ request }) => {
    const res = await request.get('saas/admin/currencies', { headers: auth, params: { page: 0, size: 50 } })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data).toEqual(expect.objectContaining({ content: expect.any(Array), page: 0, size: 50 }))
    for (const currency of data.content) {
      expect(currency.code).toMatch(/^[A-Z]{3}$/)
      expect(typeof currency.defaultCurrency).toBe('boolean')
    }
  })

  test('CUR-API-011 có đúng một tiền tệ mặc định, và /saas/currencies trả nó đầu tiên', async ({ request }) => {
    const admin = (await (await request.get('saas/admin/currencies', { headers: auth, params: { size: 200 } })).json())
      .data
    test.skip(!admin.totalElements, 'No currencies on this backend')
    const defaults = admin.content.filter((/** @type {any} */ c) => c.defaultCurrency)
    expect(defaults).toHaveLength(1)

    const picker = (await (await request.get('saas/currencies', { headers: auth })).json()).data
    expect(picker[0].id).toBe(defaults[0].id)
  })

  test('CUR-API-012 keyword khớp theo mã', async ({ request }) => {
    const all = (await (await request.get('saas/admin/currencies', { headers: auth, params: { size: 1 } })).json()).data
    test.skip(!all.content.length, 'No currencies on this backend')
    const code = all.content[0].code

    const res = await request.get('saas/admin/currencies', { headers: auth, params: { keyword: code } })

    const codes = (await res.json()).data.content.map((/** @type {any} */ c) => c.code)
    expect(codes).toContain(code)
  })
})
