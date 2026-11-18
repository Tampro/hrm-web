// @ts-check
// Feature: coupons — backend contract tests against the real IAM (project "api", token from the setup project).
// Read-only. Spec sources: hrm-be CouponController, CouponDtos (CouponDto, CouponCountsDto, CouponDetailDto).
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.describe('SaaS coupons API', () => {
  test('CPN-API-001 danh sách mã giảm giá không có token → 401', async ({ request }) => {
    expect((await request.get('saas/admin/coupons')).status()).toBe(401)
  })
})

test.describe('SaaS coupons API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  // token of the single real login done by the setup project
  test.beforeAll(() => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
  })

  test('CPN-API-010 danh sách: ResponseListDto<CouponDto>, type và enabled đúng kiểu', async ({ request }) => {
    const res = await request.get('saas/admin/coupons', { headers: auth, params: { page: 0, size: 5 } })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data).toEqual(expect.objectContaining({ content: expect.any(Array), page: 0, size: 5 }))
    for (const coupon of data.content) {
      expect(['PERCENTAGE', 'FLAT']).toContain(coupon.type)
      expect(['MANUAL', 'AUTO']).toContain(coupon.codeGeneration)
      expect(typeof coupon.enabled).toBe('boolean')
      expect(typeof coupon.timesUsed).toBe('number')
    }
  })

  test('CPN-API-011 status-counts trả {all, active, inactive} với all = active + inactive', async ({ request }) => {
    const res = await request.get('saas/admin/coupons/status-counts', { headers: auth })

    expect(res.status()).toBe(200)
    const counts = (await res.json()).data
    expect(Object.keys(counts).sort()).toEqual(['active', 'all', 'inactive'])
    expect(counts.all).toBe(counts.active + counts.inactive)
  })

  test('CPN-API-012 active=false chỉ trả mã đang tắt; type=FLAT chỉ trả mã cố định', async ({ request }) => {
    const inactive = (
      await (await request.get('saas/admin/coupons', { headers: auth, params: { active: false } })).json()
    ).data
    for (const coupon of inactive.content) expect(coupon.enabled).toBe(false)
    const flat = (await (await request.get('saas/admin/coupons', { headers: auth, params: { type: 'FLAT' } })).json())
      .data
    for (const coupon of flat.content) expect(coupon.type).toBe('FLAT')
  })

  test('CPN-API-013 chi tiết: CouponDetailDto { coupon, usageHistory }', async ({ request }) => {
    const list = (await (await request.get('saas/admin/coupons', { headers: auth, params: { size: 1 } })).json()).data
    test.skip(!list.content.length, 'No coupons on this backend')
    const id = list.content[0].id

    const res = await request.get(`saas/admin/coupons/${id}`, { headers: auth })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data.coupon.id).toBe(id)
    expect(Array.isArray(data.usageHistory)).toBe(true)
  })

  test('CPN-API-014 type=ALL — ghi nhận hành vi (FE đang bỏ tham số)', async ({ request }) => {
    const res = await request.get('saas/admin/coupons', { headers: auth, params: { type: 'ALL' } })

    test.info().annotations.push({ type: 'type=ALL', description: `HTTP ${res.status()}` })
    // Expected to be rejected like status=ALL elsewhere; any 2xx would mean the TODO in coupons/index.tsx can go.
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})
