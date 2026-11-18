// @ts-check
// Feature: referral program (super admin). Spec sources: hrm-be ReferralController (/saas/admin/referral/dashboard,
// /referred, /referred/summary, /payouts, /payouts/status-counts, /payouts/{id}/approve|reject, /settings GET+PUT),
// ReferralDtos (SettingsForm 0–100 %, threshold ≥ 0, guidelines ≤ 10000; PayoutDecisionForm notes ≤ 500),
// messages SAAS_031.
import { expect, test } from '../fixtures/index.js'
import { FAKE_ME, FAKE_SUPER_ADMIN, fail, ok, pageOf } from '../utils/mock-api.js'
import { VND } from '../plans/data.js'

const DASHBOARD = {
  totalReferredCompanies: 12,
  pendingPayouts: 750000,
  totalCommissionPaid: 2500000,
  activeReferredCompanies: 9,
  topReferrers: [
    {
      companyId: '101',
      companyName: 'E2E Alpha Co',
      companyEmail: 'alpha@e2e.invalid',
      referrals: 5,
      commissionEarned: 1200000
    }
  ],
  referralSignupsThisYear: 7,
  payoutsProcessedThisYear: 1800000
}

const REFERRED = {
  companyId: '201',
  companyName: 'E2E Gamma Co',
  companyEmail: 'gamma@e2e.invalid',
  registeredAt: '2026-11-03T02:00:00Z',
  referrerCompanyId: '101',
  referrerName: 'E2E Alpha Co',
  planName: 'E2E Pro',
  planMonthlyPrice: 490000,
  commission: 49000,
  commissionHistory: [
    {
      orderId: '801',
      orderAmount: 490000,
      commissionPercentage: 10,
      amount: 49000,
      createdDate: '2026-11-04T02:00:00Z'
    }
  ]
}

const REFERRED_NO_PLAN = {
  ...REFERRED,
  companyId: '202',
  companyName: 'E2E Delta Co',
  companyEmail: 'delta@e2e.invalid',
  planName: null,
  planMonthlyPrice: null,
  commission: null,
  commissionHistory: []
}

const PAYOUT_PENDING = {
  id: '901',
  companyId: '101',
  companyName: 'E2E Alpha Co',
  companyEmail: 'alpha@e2e.invalid',
  amount: 500000,
  status: 'PENDING',
  notes: null,
  createdDate: '2026-11-15T02:00:00Z',
  processedAt: null
}

const PAYOUT_APPROVED = {
  ...PAYOUT_PENDING,
  id: '902',
  companyName: 'E2E Beta Co',
  status: 'APPROVED',
  notes: 'Paid E2E-REF'
}

const SETTINGS = {
  enabled: true,
  commissionPercentage: 10,
  thresholdAmount: 500000,
  guidelines: 'E2E guidelines',
  updatedDate: '2026-11-01T02:00:00Z'
}

test.describe('Giới thiệu · quyền', () => {
  test('REF-001 @smoke người không phải super admin: không có menu và không gọi API', async ({
    page,
    api,
    baseURL,
    referralPage
  }) => {
    await api.signIn(String(baseURL), FAKE_ME)
    const calls = await api.route('/saas/admin/referral/dashboard', { body: ok(DASHBOARD) })

    await referralPage.goto()

    await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Giới thiệu' })).toHaveCount(0)
    expect(calls).toHaveLength(0)
  })
})

test.describe('Giới thiệu · super admin', () => {
  test.beforeEach(async ({ api, baseURL }) => {
    await api.signIn(String(baseURL), FAKE_SUPER_ADMIN)
    await api.route('/saas/currencies', { body: ok([VND]) })
  })

  test('REF-002 @smoke tổng quan: 4 thẻ, công ty giới thiệu nhiều nhất, số liệu năm nay', async ({
    api,
    referralPage
  }) => {
    await api.route('/saas/admin/referral/dashboard', { body: ok(DASHBOARD) })

    await referralPage.goto()

    await expect(referralPage.tab('Tổng quan')).toHaveAttribute('aria-selected', 'true')
    const cards = referralPage.cards('Tổng quan chương trình giới thiệu')
    await expect(cards).toContainText('12')
    await expect(cards).toContainText('750.000')
    await expect(cards).toContainText('2.500.000')
    await expect(cards).toContainText('9')
    await expect(referralPage.row('E2E Alpha Co')).toContainText('1.200.000')
    await expect(referralPage.page.getByText('1.800.000')).toBeVisible()
  })

  test('REF-003 công ty được giới thiệu: thẻ tóm tắt, cột, "Chưa có gói", lịch sử hoa hồng', async ({
    api,
    referralPage
  }) => {
    await api.route('/saas/admin/referral/referred/summary', {
      body: ok({ totalReferred: 2, withPlans: 1, totalCommission: 49000 })
    })
    const listCalls = await api.route('/saas/admin/referral/referred', {
      body: ok(pageOf([REFERRED, REFERRED_NO_PLAN]))
    })

    await referralPage.goto('/referred')

    await expect(referralPage.cards('Tóm tắt công ty được giới thiệu')).toContainText('49.000')
    const gamma = referralPage.row('E2E Gamma Co')
    await expect(gamma).toContainText('03/11/2026')
    await expect(gamma).toContainText('E2E Alpha Co')
    await expect(gamma).toContainText('490.000')
    await expect(referralPage.row('E2E Delta Co')).toContainText('Chưa có gói')
    expect(listCalls[0].query.get('page')).toBe('0')

    await gamma.getByRole('button', { name: 'Lịch sử hoa hồng của E2E Gamma Co (1)' }).click()

    await expect(referralPage.dialog).toContainText('10%')
    await expect(referralPage.dialog).toContainText('49.000')
  })

  test('REF-004 tìm công ty được giới thiệu gửi keyword đã trim', async ({ api, referralPage }) => {
    await api.route('/saas/admin/referral/referred/summary', { body: ok({ totalReferred: 0, withPlans: 0 }) })
    const listCalls = await api.route('/saas/admin/referral/referred', { body: ok(pageOf([])) })
    await referralPage.goto('/referred')

    await referralPage.keyword.fill('  gamma ')
    await referralPage.searchButton.click()

    await expect.poll(() => listCalls.at(-1)?.query.get('keyword')).toBe('gamma')
    await expect(referralPage.table).toContainText('Không có kết quả phù hợp với bộ lọc')
  })

  test('REF-005 yêu cầu rút tiền: tab Chờ duyệt gửi status=PENDING; chỉ dòng chờ có Duyệt/Từ chối', async ({
    page,
    api,
    referralPage
  }) => {
    const listCalls = await api.route('/saas/admin/referral/payouts', {
      body: ok(pageOf([PAYOUT_PENDING, PAYOUT_APPROVED]))
    })
    await api.route('/saas/admin/referral/payouts/status-counts', {
      body: ok({ all: 2, pending: 1, approved: 1, rejected: 0 })
    })

    await referralPage.goto('/payouts')

    await expect(referralPage.row('E2E Alpha Co')).toContainText('500.000')
    await expect(referralPage.row('E2E Alpha Co').getByRole('button', { name: 'Duyệt E2E Alpha Co' })).toBeVisible()
    await expect(referralPage.row('E2E Beta Co').getByRole('button')).toHaveCount(0)
    await expect(referralPage.row('E2E Beta Co')).toContainText('Paid E2E-REF')
    expect(listCalls[0].query.has('status')).toBe(false)

    await referralPage.tab('Chờ duyệt').click()

    await expect(page).toHaveURL(/tab=PENDING/)
    await expect.poll(() => listCalls.at(-1)?.query.get('status')).toBe('PENDING')
  })

  test('REF-006 @smoke duyệt rút tiền: hộp thoại nêu số tiền, gửi notes', async ({ api, referralPage }) => {
    await api.route('/saas/admin/referral/payouts', { body: ok(pageOf([PAYOUT_PENDING])) })
    await api.route('/saas/admin/referral/payouts/status-counts', {
      body: ok({ all: 1, pending: 1, approved: 0, rejected: 0 })
    })
    const approveCalls = await api.route(`/saas/admin/referral/payouts/${PAYOUT_PENDING.id}/approve`, {
      method: 'POST',
      body: ok({ ...PAYOUT_PENDING, status: 'APPROVED' })
    })
    await referralPage.goto('/payouts')

    await referralPage.row('E2E Alpha Co').getByRole('button', { name: 'Duyệt E2E Alpha Co' }).click()
    await expect(referralPage.dialog).toContainText('500.000')
    await expect(referralPage.dialog).toContainText('thanh toán thực hiện ngoài hệ thống')
    await referralPage.dialog.getByLabel('Ghi chú').fill('Paid E2E-REF-2')
    await referralPage.dialog.getByRole('button', { name: 'Duyệt' }).click()

    await expect(referralPage.toast.filter({ hasText: 'Đã duyệt' })).toBeVisible()
    expect(approveCalls[0].body).toEqual({ notes: 'Paid E2E-REF-2' })
  })

  test('REF-007 rút tiền đã được xử lý ở nơi khác: hiện SAAS_031, hộp thoại vẫn mở', async ({ api, referralPage }) => {
    await api.route('/saas/admin/referral/payouts', { body: ok(pageOf([PAYOUT_PENDING])) })
    await api.route('/saas/admin/referral/payouts/status-counts', {
      body: ok({ all: 1, pending: 1, approved: 0, rejected: 0 })
    })
    await api.route(`/saas/admin/referral/payouts/${PAYOUT_PENDING.id}/reject`, {
      method: 'POST',
      status: 409,
      body: fail('SAAS_031', 'Chỉ yêu cầu rút tiền đang chờ mới có thể duyệt hoặc từ chối.')
    })
    await referralPage.goto('/payouts')

    await referralPage.row('E2E Alpha Co').getByRole('button', { name: 'Từ chối E2E Alpha Co' }).click()
    await referralPage.dialog.getByRole('button', { name: 'Từ chối' }).click()

    await expect(referralPage.toast).toContainText('Chỉ yêu cầu rút tiền đang chờ mới có thể duyệt hoặc từ chối.')
    await expect(referralPage.dialog).toBeVisible()
  })

  test('REF-008 cài đặt: điền sẵn, validation % > 100 và số âm, lưu gửi đúng payload', async ({
    api,
    referralPage
  }) => {
    await api.route('/saas/admin/referral/settings', { method: 'GET', body: ok(SETTINGS) })
    const saveCalls = await api.route('/saas/admin/referral/settings', { method: 'PUT', body: ok(SETTINGS) })
    await referralPage.goto('/settings')

    await expect(referralPage.field('Tỷ lệ hoa hồng (%)')).toHaveValue('10')
    await expect(referralPage.page.getByRole('switch', { name: 'Bật chương trình giới thiệu' })).toBeChecked()

    await referralPage.field('Tỷ lệ hoa hồng (%)').fill('101')
    await referralPage.field('Mức tối thiểu để rút (₫)').fill('-1')
    await expect(referralPage.page.getByText('Giảm theo phần trăm tối đa 100')).toBeVisible()
    await expect(referralPage.page.getByText('Giá trị tối thiểu là 0')).toBeVisible()
    await referralPage.saveButton.click()
    expect(saveCalls).toHaveLength(0)

    await referralPage.field('Tỷ lệ hoa hồng (%)').fill('12.5')
    await referralPage.field('Mức tối thiểu để rút (₫)').fill('300000')
    await referralPage.field('Hướng dẫn chương trình').fill('')
    await referralPage.page.getByRole('switch', { name: 'Bật chương trình giới thiệu' }).click()
    await referralPage.saveButton.click()

    await expect(referralPage.toast.filter({ hasText: 'Đã lưu cài đặt' })).toBeVisible()
    expect(saveCalls[0].body).toEqual({ enabled: false, commissionPercentage: 12.5, thresholdAmount: 300000 })
  })
})
