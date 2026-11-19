// @ts-check
// Feature: email templates — backend contract tests against the real IAM (project "api", token from the setup project).
// Read-only: GETs only. Spec sources: hrm-be EmailTemplateController, EmailTemplateService DTOs, EEmailTemplate.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const BASE = 'settings/admin/email-templates'

test.describe('Email templates API', () => {
  test('ET-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(BASE)).status()).toBe(401)
  })
})

test.describe('Email templates API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  test.beforeAll(() => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
  })

  test('ET-API-010 danh sách: TemplateRow, id là chuỗi, có các code đã biết', async ({ request }) => {
    const res = await request.get(BASE, { headers: auth, params: { size: 100 } })

    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    expect(Object.keys(data.content[0]).sort()).toEqual(
      ['code', 'createdDate', 'fromName', 'id', 'name', 'updatedDate'].sort()
    )
    expect(typeof data.content[0].id).toBe('string')
    // the FE translates these codes (email_template.name.<CODE>)
    expect(data.content.map((/** @type {any} */ r) => r.code)).toEqual(
      expect.arrayContaining(['USER_CREATE', 'COMPANY_CREATE', 'PAYOUT_APPROVED', 'PLAN_ORDER_APPROVED'])
    )
  })

  test('ET-API-011 chi tiết: TemplateDetail, biến chung app_name / app_url đứng đầu', async ({ request }) => {
    const list = (await (await request.get(BASE, { headers: auth })).json()).data
    const res = await request.get(`${BASE}/${list.content[0].id}`, { headers: auth })

    expect(res.status()).toBe(200)
    const data = (await res.json()).data
    expect(Object.keys(data).sort()).toEqual(['contents', 'template', 'toggleableByCompany', 'variables'])
    expect(data.variables.slice(0, 2)).toEqual(['app_name', 'app_url'])
    for (const c of data.contents) expect(['vi', 'en', 'ko']).toContain(c.lang)
  })

  test('ET-API-012 xem trước ngôn ngữ không hỗ trợ → 400 EMAIL_002; id không tồn tại → 404 EMAIL_001', async ({
    request
  }) => {
    const list = (await (await request.get(BASE, { headers: auth })).json()).data

    const badLang = await request.get(`${BASE}/${list.content[0].id}/preview/fr`, { headers: auth })
    expect(badLang.status()).toBe(400)
    expect((await badLang.json()).code).toBe('EMAIL_002')

    const missing = await request.get(`${BASE}/999999999`, { headers: auth })
    expect(missing.status()).toBe(404)
    expect((await missing.json()).code).toBe('EMAIL_001')
  })
})
