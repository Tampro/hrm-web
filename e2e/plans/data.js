// @ts-check
// Obviously fake SaaS data (Spec: PlanDto, PlanRequestDto, AdminOrderDto, CurrencyDto).

export const VND = { id: '1', code: 'VND', name: 'Việt Nam Đồng', symbol: '₫', defaultCurrency: true }

export const PLAN_FREE = {
  id: '1',
  code: 'E2E_FREE',
  name: 'E2E Free',
  description: 'Starter plan for e2e',
  monthlyPrice: 0,
  yearlyPrice: 0,
  maxUsers: 5,
  maxEmployees: 10,
  storageLimitGb: 1,
  trialDays: 0,
  aiIntegration: false,
  defaultPlan: true,
  enabled: true
}

export const PLAN_PRO = {
  id: '2',
  code: 'E2E_PRO',
  name: 'E2E Pro',
  description: null,
  monthlyPrice: 490000,
  yearlyPrice: null,
  maxUsers: null,
  maxEmployees: null,
  storageLimitGb: null,
  trialDays: 14,
  aiIntegration: true,
  defaultPlan: false,
  enabled: true
}

export const PLAN_OLD = { ...PLAN_PRO, id: '3', code: 'E2E_OLD', name: 'E2E Old', trialDays: 0, enabled: false }

export const PLANS = [PLAN_PRO, PLAN_OLD, PLAN_FREE]

export const REQUEST_PENDING = {
  id: '701',
  companyId: '101',
  companyName: 'E2E Alpha Co',
  companyEmail: 'alpha@e2e.invalid',
  planId: '2',
  planName: 'E2E Pro',
  billingCycle: 'YEARLY',
  message: 'Please upgrade us',
  status: 'PENDING',
  createdDate: '2026-11-10T02:00:00Z',
  processedAt: null,
  notes: null,
  orderId: null
}

export const REQUEST_APPROVED = {
  ...REQUEST_PENDING,
  id: '702',
  companyName: 'E2E Beta Co',
  companyEmail: 'beta@e2e.invalid',
  billingCycle: 'MONTHLY',
  status: 'APPROVED',
  createdDate: '2026-11-01T02:00:00Z'
}

export const SAAS_COUNTS = { all: 2, pending: 1, approved: 1, rejected: 0, cancelled: 0 }

export const ORDER_PENDING = {
  order: {
    id: '801',
    orderNumber: 'E2E-ORD-0001',
    companyId: '101',
    planId: '2',
    billingCycle: 'MONTHLY',
    couponCode: 'E2E10',
    originalPrice: 490000,
    discountAmount: 49000,
    finalPrice: 441000,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'E2E-REF-1',
    status: 'PENDING',
    createdDate: '2026-11-12T03:00:00Z',
    processedAt: null,
    notes: null,
    bankTransfer: {
      bankName: 'E2E Bank',
      accountNumber: '0000000000',
      accountName: 'E2E ACCOUNT',
      transferContent: 'E2E-ORD-0001'
    }
  },
  companyName: 'E2E Alpha Co',
  companyEmail: 'alpha@e2e.invalid',
  planName: 'E2E Pro'
}

export const ORDER_APPROVED = {
  order: {
    ...ORDER_PENDING.order,
    id: '802',
    orderNumber: 'E2E-ORD-0002',
    couponCode: null,
    discountAmount: 0,
    finalPrice: 490000,
    paymentMethod: 'MANUAL',
    status: 'APPROVED',
    bankTransfer: null
  },
  companyName: 'E2E Beta Co',
  companyEmail: 'beta@e2e.invalid',
  planName: 'E2E Pro'
}
