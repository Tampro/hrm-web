// @ts-check
// Feature: referral — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Dashboard / referred / payouts are read-only: approving or rejecting a real payout changes a company's balance.
// Settings are written and then RESTORED to the exact values read at the start (afterAll, even on failure).
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const API_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

/** @type {any} settings read before the test changes them */
let original = null

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} method
 * @param {RegExp} path
 */
const nextCall = (page, method, path) =>
  page.waitForResponse((r) => {
    const { pathname } = new URL(r.url())
    // API calls only: page routes share the same tail (/dashboard/referral/settings is an HTML document)
    return r.request().method() === method && pathname.startsWith('/api/') && path.test(pathname)
  })

test.describe('Giới thiệu · backend thật', () => {
  test.afterAll(async ({ playwright }) => {
    if (!original) return
    // restore through the API so a failing UI step can't leave changed settings behind
    const request = await playwright.request.newContext({ baseURL: API_URL })
    const res = await request.put('saas/admin/referral/settings', {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` },
      data: {
        enabled: original.enabled,
        commissionPercentage: original.commissionPercentage,
        thresholdAmount: original.thresholdAmount,
        ...(original.guidelines ? { guidelines: original.guidelines } : {})
      }
    })
    expect(res.ok(), 'settings restore failed').toBe(true)
    await request.dispose()
  })

  test('REF-INT-001 tổng quan, danh sách và yêu cầu rút tiền thật hiển thị khớp API', async ({
    page,
    referralPage
  }) => {
    const dashboard = nextCall(page, 'GET', /\/referral\/dashboard$/)
    await referralPage.goto()
    const d = (await (await dashboard).json()).data
    await expect(referralPage.cards('Tổng quan chương trình giới thiệu')).toContainText(
      String(d.totalReferredCompanies)
    )

    const referred = nextCall(page, 'GET', /\/referral\/referred$/)
    await referralPage.tab('Công ty được giới thiệu').click()
    const r = (await (await referred).json()).data
    await expect(page.getByText(new RegExp(`^Hiển thị ${r.content.length} / ${r.totalElements}$`))).toBeVisible()

    const payouts = nextCall(page, 'GET', /\/referral\/payouts$/)
    const counts = nextCall(page, 'GET', /\/referral\/payouts\/status-counts$/)
    await referralPage.tab('Yêu cầu rút tiền').click()
    const p = (await (await payouts).json()).data
    const c = (await (await counts).json()).data
    expect(p.totalElements).toBe(c.all)
    await expect(referralPage.tab('Tất cả')).toContainText(String(c.all))
  })

  test('REF-INT-002 lưu cài đặt thật rồi tải lại thấy giá trị mới (khôi phục sau test)', async ({
    page,
    referralPage
  }) => {
    const loaded = nextCall(page, 'GET', /\/referral\/settings$/)
    await referralPage.goto('/settings')
    original = (await (await loaded).json()).data
    const nextPercent = original.commissionPercentage === 7.5 ? '8.5' : '7.5'

    await referralPage.field('Tỷ lệ hoa hồng (%)').fill(nextPercent)
    const saved = nextCall(page, 'PUT', /\/referral\/settings$/)
    await referralPage.saveButton.click()

    const body = await (await saved).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data.commissionPercentage).toBe(Number(nextPercent))
    expect(body.data.enabled).toBe(original.enabled)
    expect(body.data.thresholdAmount).toBe(original.thresholdAmount)

    await page.reload()
    await expect(referralPage.field('Tỷ lệ hoa hồng (%)')).toHaveValue(nextPercent)
  })
})
