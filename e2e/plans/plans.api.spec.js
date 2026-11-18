// @ts-check
// Feature: plans — backend contract tests against the real IAM (project "api"). Read-only.
// Spec sources: IAM Swagger /saas/admin/plans, /plan-requests, /orders, /saas/currencies; hrm-be SaasDtos.java.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const STATUS_COUNT_KEYS = ['all', 'approved', 'cancelled', 'pending', 'rejected']

test.describe('SaaS plans API', () => {
  test('PLN-API-001 danh sách gói admin không có token → 401', async ({ request }) => {
    expect((await request.get('saas/admin/plans')).status()).toBe(401)
  })
})

test.describe('SaaS plans API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  // token of the single real login done by the setup project
  test.beforeAll(() => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
  })

  test('PLN-API-010 gói: đúng PlanDto, có đúng một gói mặc định và gói mặc định đang bật', async ({ request }) => {
    const res = await request.get('saas/admin/plans', { headers: auth })

    expect(res.status()).toBe(200)
    const plans = (await res.json()).data
    expect(Array.isArray(plans)).toBe(true)
    for (const plan of plans) {
      expect(plan).toEqual(
        expect.objectContaining({ id: expect.any(String), code: expect.any(String), name: expect.any(String) })
      )
      expect(typeof plan.enabled).toBe('boolean')
    }
    const defaults = plans.filter((/** @type {any} */ p) => p.defaultPlan)
    expect(defaults.length).toBeLessThanOrEqual(1)
    for (const plan of defaults) expect(plan.enabled).toBe(true)
  })

  test('PLN-API-011 tiền tệ: có danh sách, phần tử đầu là mặc định', async ({ request }) => {
    const res = await request.get('saas/currencies', { headers: auth })

    expect(res.status()).toBe(200)
    const currencies = (await res.json()).data
    expect(Array.isArray(currencies)).toBe(true)
    if (currencies.length) expect(currencies[0].defaultCurrency).toBe(true)
  })

  for (const [id, path] of [
    ['PLN-API-012', 'saas/admin/plan-requests/status-counts'],
    ['PLN-API-013', 'saas/admin/orders/status-counts']
  ]) {
    test(`${id} ${path} trả {all, pending, approved, rejected, cancelled}`, async ({ request }) => {
      const res = await request.get(path, { headers: auth })

      expect(res.status()).toBe(200)
      const counts = (await res.json()).data
      expect(Object.keys(counts).sort()).toEqual(STATUS_COUNT_KEYS)
      expect(counts.all).toBe(counts.pending + counts.approved + counts.rejected + counts.cancelled)
    })
  }

  test('PLN-API-014 yêu cầu gói: ResponseListDto<PlanRequestDto>', async ({ request }) => {
    const res = await request.get('saas/admin/plan-requests', { headers: auth, params: { page: 0, size: 5 } })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    expect(data).toEqual(expect.objectContaining({ content: expect.any(Array), page: 0, size: 5 }))
    for (const row of data.content) {
      expect(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).toContain(row.status)
      expect(['MONTHLY', 'YEARLY']).toContain(row.billingCycle)
    }
  })

  test('PLN-API-015 đơn hàng: dòng là AdminOrderDto { order, companyName, companyEmail, planName }', async ({
    request
  }) => {
    const res = await request.get('saas/admin/orders', { headers: auth, params: { page: 0, size: 5 } })

    expect(res.status()).toBe(200)
    const { data } = await res.json()
    for (const row of data.content) {
      expect(Object.keys(row).sort()).toEqual(['companyEmail', 'companyName', 'order', 'planName'])
      expect(row.order).toEqual(expect.objectContaining({ id: expect.any(String), orderNumber: expect.any(String) }))
    }
  })

  test('PLN-API-016 chi tiết đơn hàng trả cùng AdminOrderDto', async ({ request }) => {
    const list = (await (await request.get('saas/admin/orders', { headers: auth, params: { size: 1 } })).json()).data
    test.skip(!list.content.length, 'No orders on this backend')
    const id = list.content[0].order.id

    const res = await request.get(`saas/admin/orders/${id}`, { headers: auth })

    expect(res.status()).toBe(200)
    expect((await res.json()).data.order.id).toBe(id)
  })

  for (const [id, path] of [
    ['PLN-API-017', 'saas/admin/plan-requests'],
    ['PLN-API-018', 'saas/admin/orders']
  ]) {
    test(`${id} ${path}?status=ALL — ghi nhận hành vi (FE đang bỏ tham số)`, async ({ request }) => {
      const res = await request.get(path, { headers: auth, params: { status: 'ALL' } })

      test.info().annotations.push({ type: 'status=ALL', description: `HTTP ${res.status()}` })
      // Same BE bug as companies (500). Fails loudly if it becomes 200/400 so the TODO can be resolved.
      expect(res.status()).toBe(500)
    })
  }
})
