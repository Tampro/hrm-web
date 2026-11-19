// @ts-check
// Feature: designations — backend contract tests against the real employee-service (project "api"). Read-only.
// Spec sources: DepartmentController, DepartmentDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Designations API', () => {
  test('DES-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}org/designations`)).status()).toBe(401)
  })
})

test.describe('Designations API · super admin', () => {
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

  test('DES-API-010 super admin không gửi companyId → 400 EMP_019', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/designations`, { headers: auth })

    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('EMP_019')
  })

  test('DES-API-011 danh sách: phân trang chuẩn, mỗi dòng có department và branch; status=ALL bị từ chối', async ({
    request
  }) => {
    const res = await request.get(`${EMP_URL}org/designations`, { headers: auth, params: { companyId, size: 5 } })
    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    expect(Object.keys(data).sort()).toEqual(['content', 'last', 'page', 'size', 'totalElements', 'totalPages'].sort())
    for (const row of data.content) expect(row).toHaveProperty('branch')

    const all = await request.get(`${EMP_URL}org/designations`, {
      headers: auth,
      params: { companyId, status: 'ALL' }
    })
    expect(all.ok()).toBe(false)
  })

  test('DES-API-012 chức danh không tồn tại → 404 EMP_004', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/designations/999999999`, { headers: auth })

    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('EMP_004')
  })
})
