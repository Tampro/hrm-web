// @ts-check
// Obviously fake coupons (Spec: CouponDto, CouponDetailDto, CouponUsageDto).

export const COUPON_PERCENT = {
  id: '301',
  code: 'E2E_SUMMER20',
  codeGeneration: 'MANUAL',
  name: 'E2E Summer',
  type: 'PERCENTAGE',
  discountValue: 20,
  minimumSpend: 400000,
  maximumSpend: null,
  useLimitTotal: 100,
  useLimitPerCompany: 1,
  expiryDate: '2026-12-31',
  enabled: true,
  timesUsed: 3,
  createdDate: '2026-11-01T02:00:00Z'
}

export const COUPON_FLAT = {
  id: '302',
  code: 'E2EAUTO8',
  codeGeneration: 'AUTO',
  name: 'E2E Flat',
  type: 'FLAT',
  discountValue: 50000,
  minimumSpend: null,
  maximumSpend: null,
  useLimitTotal: null,
  useLimitPerCompany: null,
  expiryDate: null,
  enabled: false,
  timesUsed: 0,
  createdDate: '2026-11-05T02:00:00Z'
}

export const COUPON_COUNTS = { all: 2, active: 1, inactive: 1 }

export const COUPON_DETAIL = {
  coupon: COUPON_PERCENT,
  usageHistory: [
    {
      orderId: '801',
      orderNumber: 'E2E-ORD-0001',
      companyId: '101',
      companyName: 'E2E Alpha Co',
      companyEmail: 'alpha@e2e.invalid',
      orderAmount: 490000,
      discountApplied: 98000,
      finalPrice: 392000,
      status: 'APPROVED',
      usedAt: '2026-11-12T03:00:00Z'
    }
  ]
}
