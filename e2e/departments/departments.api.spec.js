// @ts-check
// Feature: departments — backend contract tests against the real employee-service (project "api"). Read-only.
// Spec sources: DepartmentController, DepartmentDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Departments API', () => {
  test('DEP-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}org/departments`)).status()).toBe(401)
  })
})

test.describe('Departments API · super admin', () => {
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

  test('DEP-API-010 super admin không gửi companyId → 400 EMP_019', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/departments`, { headers: auth })

    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('EMP_019')
  })

  test('DEP-API-011 status-counts: {all, active, inactive} và all = tổng; status=ALL bị từ chối', async ({
    request
  }) => {
    const res = await request.get(`${EMP_URL}org/departments/status-counts`, { headers: auth, params: { companyId } })
    expect(res.status()).toBe(200)
    const c = (await res.json()).data
    expect(Object.keys(c).sort()).toEqual(['active', 'all', 'inactive'])
    expect(c.all).toBe(c.active + c.inactive)

    const all = await request.get(`${EMP_URL}org/departments`, { headers: auth, params: { companyId, status: 'ALL' } })
    expect(all.ok()).toBe(false)
  })

  test('DEP-API-012 phòng ban không tồn tại → 404 EMP_003', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/departments/999999999`, { headers: auth })

    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('EMP_003')
  })
})
