// @ts-check
// Feature: document types — backend contract tests against the real employee-service (project "api"). Read-only.
// Spec sources: DocumentTypeController, DocumentTypeDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Document types API', () => {
  test('DOC-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${EMP_URL}org/document-types`)).status()).toBe(401)
  })
})

test.describe('Document types API · super admin', () => {
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

  test('DOC-API-010 danh sách là trang (FE trang Loại tài liệu); /options là mảng (FE dropdown nhân viên)', async ({
    request
  }) => {
    const list = await request.get(`${EMP_URL}org/document-types`, { headers: auth, params: { companyId } })
    expect(list.status()).toBe(200)
    const page = (await list.json()).data
    expect(Object.keys(page).sort()).toEqual(['content', 'last', 'page', 'size', 'totalElements', 'totalPages'].sort())
    expect(Object.keys(page.content[0]).sort()).toEqual(
      ['createdDate', 'defaultSlot', 'description', 'id', 'name', 'required', 'system', 'updatedDate'].sort()
    )
    // Spec: system types first
    expect(page.content[0].system).toBe(true)

    const options = await request.get(`${EMP_URL}org/document-types/options`, { headers: auth, params: { companyId } })
    expect(options.status()).toBe(200)
    expect(Array.isArray((await options.json()).data)).toBe(true)
  })

  test('DOC-API-011 lọc required=true chỉ trả loại bắt buộc', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/document-types`, {
      headers: auth,
      params: { companyId, required: true, size: 100 }
    })

    expect(res.status()).toBe(200)
    for (const row of (await res.json()).data.content) expect(row.required).toBe(true)
  })

  test('DOC-API-012 loại tài liệu không tồn tại → 404 EMP_005', async ({ request }) => {
    const res = await request.get(`${EMP_URL}org/document-types/999999999`, { headers: auth })

    expect(res.status()).toBe(404)
    expect((await res.json()).code).toBe('EMP_005')
  })
})
