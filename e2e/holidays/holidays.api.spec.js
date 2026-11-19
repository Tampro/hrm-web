// @ts-check
// Feature: holidays — backend contract tests against the real employee-service (project "api"). Read-only.
// Spec sources: HolidayController, HolidayDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Holidays API', () => {
  test('HOL-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}org/holidays`)).status()).toBe(401)
  })
})

test.describe('Holidays API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  let companyId = ''
  test.beforeAll(async ({ playwright }) => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
    const iam = await playwright.request.newContext()
    const companies = (await (await iam.get(`${IAM_URL}iam/companies`, { headers: auth, params: { size: 50 } })).json())
      .data.content
    companyId = companies.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    await iam.dispose()
  })

  test('HOL-API-010 super admin không gửi companyId → 400 EMP_019', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/holidays`, { headers: auth })

    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('EMP_019')
  })

  test('HOL-API-011 loại ngày lễ: có 4 loại hệ thống với màu #RRGGBB (FE dịch theo tên)', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/holiday-categories`, { headers: auth, params: { companyId } })

    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    const system = data.filter((/** @type {any} */ c) => c.system).map((/** @type {any} */ c) => c.name)
    expect(system.sort()).toEqual(['Company Specific', 'National', 'Regional', 'Religious'])
    for (const c of data) expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  test('HOL-API-012 lịch: from/to bắt buộc; to trước from → EMP_034; quá 400 ngày → EMP_036', async ({ request }) => {
    const ok = await request.get(`${EMP_URL}org/holidays/calendar`, {
      headers: auth,
      params: { companyId, from: '2026-08-31', to: '2026-10-11' }
    })
    expect(ok.status()).toBe(200)
    expect(Array.isArray((await ok.json()).data)).toBe(true)

    const reversed = await request.get(`${EMP_URL}org/holidays/calendar`, {
      headers: auth,
      params: { companyId, from: '2026-10-11', to: '2026-08-31' }
    })
    expect((await reversed.json()).code).toBe('EMP_034')

    const tooLong = await request.get(`${EMP_URL}org/holidays/calendar`, {
      headers: auth,
      params: { companyId, from: '2026-01-01', to: '2027-12-31' }
    })
    expect((await tooLong.json()).code).toBe('EMP_036')
  })

  test('HOL-API-013 xuất PDF / iCal trả đúng loại tệp; ngày lễ không tồn tại → 404 EMP_032', async ({ request }) => {
    const pdf = await request.get(`${EMP_URL}org/holidays/export/pdf`, { headers: auth, params: { companyId } })
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('application/pdf')

    const ical = await request.get(`${EMP_URL}org/holidays/export/ical`, { headers: auth, params: { companyId } })
    expect(ical.status()).toBe(200)
    expect(ical.headers()['content-type']).toContain('text/calendar')

    const missing = await request.get(`${EMP_URL}org/holidays/999999999`, { headers: auth })
    expect(missing.status()).toBe(404)
    expect((await missing.json()).code).toBe('EMP_032')
  })
})
