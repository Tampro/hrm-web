// @ts-check
// Feature: branches — backend contract tests against the real employee-service (project "api"). Read-only: GETs only.
// Spec sources: BranchController, BranchDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Branches API', () => {
  test('BR-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}org/branches`)).status()).toBe(401)
  })
})

test.describe('Branches API · super admin', () => {
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

  test('BR-API-010 super admin không gửi companyId → 400 EMP_019', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/branches`, { headers: auth })

    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('EMP_019')
  })

  test('BR-API-011 danh sách: phân trang chuẩn; status=ALL bị từ chối (FE gửi undefined cho tab Tất cả)', async ({
    request
  }) => {
    const res = await request.get(`${EMP_URL}org/branches`, { headers: auth, params: { companyId, size: 5 } })
    expect(res.status()).toBe(200)
    expect(Object.keys((await res.json()).data).sort()).toEqual(
      ['content', 'last', 'page', 'size', 'totalElements', 'totalPages'].sort()
    )

    const all = await request.get(`${EMP_URL}org/branches`, { headers: auth, params: { companyId, status: 'ALL' } })
    expect(all.ok()).toBe(false)
  })

  test('BR-API-012 chi nhánh không tồn tại → 404 EMP_002', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/branches/999999999`, { headers: auth })

    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('EMP_002')
  })
})
