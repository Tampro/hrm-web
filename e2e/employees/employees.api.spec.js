// @ts-check
// Feature: employees — backend contract tests against the real employee-service (project "api", token from the setup
// project). Read-only: GETs only. Spec sources: EmployeeController, EmployeeFileController, OrgController, EmployeeDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

/** employee-service is its own backend (the gateway routes /employees and /org to it) */
const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Employees API', () => {
  test('EMP-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}employees`)).status()).toBe(401)
  })
})

test.describe('Employees API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  /** an active company to read from */
  let companyId = ''
  test.beforeAll(async ({ playwright }) => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
    const iam = await playwright.request.newContext()
    const companies = (await (await iam.get(`${IAM_URL}iam/companies`, { headers: auth, params: { size: 50 } })).json())
      .data.content
    companyId = companies.find((/** @type {any} */ c) => c.status === 'ACTIVE')?.id ?? ''
    await iam.dispose()
  })

  test('EMP-API-010 super admin không gửi companyId → 400 EMP_019 (FE bắt chọn công ty)', async ({ request }) => {
    const res = await request.get(`${EMP_URL}employees`, { headers: auth })

    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('EMP_019')
  })

  test('EMP-API-011 danh sách: phân trang chuẩn; status=ALL bị từ chối (FE gửi undefined cho tab Tất cả)', async ({
    request
  }) => {
    const res = await request.get(`${EMP_URL}employees`, { headers: auth, params: { companyId, page: 0, size: 5 } })
    expect(res.status()).toBe(200)
    expect(Object.keys((await res.json()).data).sort()).toEqual(
      ['content', 'last', 'page', 'size', 'totalElements', 'totalPages'].sort()
    )

    const all = await request.get(`${EMP_URL}employees`, { headers: auth, params: { companyId, status: 'ALL' } })
    // Spec gap: the BE answers 500 (enum conversion not mapped to 400) — any error is enough to keep sending undefined
    expect(all.ok()).toBe(false)
  })

  test('EMP-API-012 status-counts: đủ 5 tab và all = tổng', async ({ request }) => {
    const res = await request.get(`${EMP_URL}employees/status-counts`, { headers: auth, params: { companyId } })

    expect(res.status()).toBe(200)
    const c = (await res.json()).data
    expect(Object.keys(c).sort()).toEqual(['active', 'all', 'inactive', 'probation', 'terminated'])
    expect(c.all).toBe(c.active + c.inactive + c.probation + c.terminated)
  })

  test('EMP-API-013 dropdown tổ chức và loại tài liệu: mảng {id, name}; loại hệ thống có sẵn', async ({ request }) => {
    for (const path of ['org/branches/options', 'org/departments/options', 'org/designations/options']) {
      const res = await request.get(`${EMP_URL}${path}`, { headers: auth, params: { companyId } })
      expect(res.status(), path).toBe(200)
      expect(Array.isArray((await res.json()).data), path).toBe(true)
    }
    const types = (
      await (await request.get(`${EMP_URL}org/document-types/options`, { headers: auth, params: { companyId } })).json()
    ).data
    expect(types.some((/** @type {any} */ d) => d.system)).toBe(true)
    // Spec: the dropdowns read /options (a list); /org/document-types is the paged list of the Document Types page
    expect(Object.keys(types[0]).sort()).toEqual(
      ['createdDate', 'defaultSlot', 'description', 'id', 'name', 'required', 'system', 'updatedDate'].sort()
    )
  })

  test('EMP-API-014 sơ đồ tổ chức: {companyName, members, children}', async ({ request }) => {
    const res = await request.get(`${EMP_URL}employees/org-chart`, { headers: auth, params: { companyId } })

    expect(res.status()).toBe(200)
    expect(Object.keys((await res.json()).data).sort()).toEqual(['children', 'companyName', 'members'])
  })

  test('EMP-API-015 nhân viên không tồn tại → 404 EMP_001; file mẫu nhập là .xlsx', async ({ request }) => {
    const missing = await request.get(`${EMP_URL}employees/999999999`, { headers: auth })
    expect(missing.status()).toBe(404)
    expect((await missing.json()).code).toBe('EMP_001')

    const template = await request.get(`${EMP_URL}employees/import/template`, { headers: auth })
    expect(template.status()).toBe(200)
    expect(template.headers()['content-type']).toContain('spreadsheetml')
  })
})
