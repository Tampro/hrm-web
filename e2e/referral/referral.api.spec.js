// @ts-check
// Feature: referral — backend contract tests against the real IAM (project "api", token from the setup project).
// Read-only. Spec sources: hrm-be ReferralController, ReferralDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.describe('SaaS referral API', () => {
  test('REF-API-001 dashboard không có token → 401', async ({ request }) => {
    expect((await request.get('saas/admin/referral/dashboard')).status()).toBe(401)
  })
})

test.describe('SaaS referral API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  // token of the single real login done by the setup project
  test.beforeAll(() => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
  })

  test('REF-API-010 dashboard: đúng DashboardDto', async ({ request }) => {
    const res = await request.get('saas/admin/referral/dashboard', { headers: auth })

    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    expect(Object.keys(data).sort()).toEqual(
      [
        'activeReferredCompanies',
        'payoutsProcessedThisYear',
        'pendingPayouts',
        'referralSignupsThisYear',
        'topReferrers',
        'totalCommissionPaid',
        'totalReferredCompanies'
      ].sort()
    )
    expect(Array.isArray(data.topReferrers)).toBe(true)
  })

  test('REF-API-011 status-counts trả {all, pending, approved, rejected} với all là tổng', async ({ request }) => {
    const res = await request.get('saas/admin/referral/payouts/status-counts', { headers: auth })

    expect(res.status()).toBe(200)
    const counts = (await res.json()).data
    expect(Object.keys(counts).sort()).toEqual(['all', 'approved', 'pending', 'rejected'])
    expect(counts.all).toBe(counts.pending + counts.approved + counts.rejected)
  })

  test('REF-API-012 payouts status=PENDING chỉ trả yêu cầu chờ', async ({ request }) => {
    const res = await request.get('saas/admin/referral/payouts', { headers: auth, params: { status: 'PENDING' } })

    expect(res.status()).toBe(200)
    for (const payout of (await res.json()).data.content) expect(payout.status).toBe('PENDING')
  })

  test('REF-API-013 referred + summary: ResponseListDto và {totalReferred, withPlans, totalCommission}', async ({
    request
  }) => {
    const list = await request.get('saas/admin/referral/referred', { headers: auth, params: { page: 0, size: 5 } })
    expect(list.status()).toBe(200)
    expect((await list.json()).data).toEqual(expect.objectContaining({ content: expect.any(Array), page: 0, size: 5 }))

    const summary = (await (await request.get('saas/admin/referral/referred/summary', { headers: auth })).json()).data
    expect(Object.keys(summary).sort()).toEqual(['totalCommission', 'totalReferred', 'withPlans'])
  })

  test('REF-API-014 settings: đúng SettingsDto, tỷ lệ trong 0–100', async ({ request }) => {
    const res = await request.get('saas/admin/referral/settings', { headers: auth })

    expect(res.status()).toBe(200)
    const settings = (await res.json()).data
    expect(typeof settings.enabled).toBe('boolean')
    expect(settings.commissionPercentage).toBeGreaterThanOrEqual(0)
    expect(settings.commissionPercentage).toBeLessThanOrEqual(100)
  })

  test('REF-API-015 payouts?status=ALL — ghi nhận hành vi (FE đang bỏ tham số)', async ({ request }) => {
    const res = await request.get('saas/admin/referral/payouts', { headers: auth, params: { status: 'ALL' } })

    test.info().annotations.push({ type: 'status=ALL', description: `HTTP ${res.status()}` })
    // Same BE bug as the other list endpoints (500). Fails loudly once it is fixed so the TODO can go.
    expect(res.status()).toBe(500)
  })
})
