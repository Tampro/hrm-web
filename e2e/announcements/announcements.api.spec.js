// @ts-check
// Feature: announcements — backend contract tests against the real employee-service (project "api"). Read-only.
// Spec sources: AnnouncementController, AnnouncementDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Announcements API', () => {
  test('ANN-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}org/announcements`)).status()).toBe(401)
  })
})

test.describe('Announcements API · super admin', () => {
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

  test('ANN-API-010 super admin không gửi companyId → 400 EMP_019', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/announcements`, { headers: auth })

    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('EMP_019')
  })

  test('ANN-API-011 tab-counts {all, highPriority, featured, upcoming}; tab=ALL là giá trị hợp lệ', async ({
    request
  }) => {
    const counts = await request.get(`${EMP_URL}org/announcements/tab-counts`, { headers: auth, params: { companyId } })
    expect(counts.status()).toBe(200)
    expect(Object.keys((await counts.json()).data).sort()).toEqual(['all', 'featured', 'highPriority', 'upcoming'])

    const all = await request.get(`${EMP_URL}org/announcements`, { headers: auth, params: { companyId, tab: 'ALL' } })
    expect(all.status()).toBe(200)
  })

  test('ANN-API-012 loại hệ thống General / Policy / Event / HR Update (FE dịch theo tên)', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/announcement-categories`, { headers: auth, params: { companyId } })

    expect(res.status()).toBe(200)
    const system = (await res.json()).data
      .filter((/** @type {any} */ c) => c.system)
      .map((/** @type {any} */ c) => c.name)
    expect(system.sort()).toEqual(['Event', 'General', 'HR Update', 'Policy'])
  })

  test('ANN-API-013 thông báo không tồn tại → 404 EMP_037', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/announcements/999999999`, { headers: auth })

    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('EMP_037')
  })
})
