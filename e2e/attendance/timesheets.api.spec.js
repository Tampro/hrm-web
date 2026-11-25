// @ts-check
// Feature: timesheet — backend contract tests against the real attendance-service (project "api").
// The one entry created here is deleted in the same test. Spec sources: TimesheetController, TimesheetDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const ATT_URL = process.env.E2E_ATTENDANCE_API_URL || 'http://localhost:8084/api/v1/'
const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Timesheet API', () => {
  test('TS-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${ATT_URL}attendance/timesheets/week?date=2026-02-04`)).status()).toBe(401)
  })
})

test.describe('Timesheet API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  let companyId = ''
  let employeeId = ''
  test.beforeAll(async ({ playwright }) => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
    const ctx = await playwright.request.newContext()
    const companies = (await (await ctx.get(`${IAM_URL}iam/companies`, { headers: auth, params: { size: 50 } })).json())
      .data.content
    // the first active company that has an employee (the week grid has one row per employee)
    for (const c of companies.filter((/** @type {any} */ c) => c.status === 'ACTIVE')) {
      const res = await ctx.get(`${EMP_URL}employees`, { headers: auth, params: { companyId: c.id, size: 1 } })
      const first = (await res.json()).data?.content?.[0]
      companyId ||= c.id
      if (first) {
        companyId = c.id
        employeeId = first.id
        break
      }
    }
    await ctx.dispose()
  })

  test('TS-API-010 tuần: weekStart là thứ Hai; Week / WeekRow / DayCell / counts đúng trường FE dùng', async ({
    request
  }) => {
    const res = await request.get(`${ATT_URL}attendance/timesheets/week`, {
      headers: auth,
      params: { companyId, date: '2026-02-04', page: 0, size: 5 }
    })
    expect(res.status()).toBe(200)
    const week = (await res.json()).data
    expect(week.weekStart).toBe('2026-02-02')
    expect(week.weekEnd).toBe('2026-02-08')
    expect(Object.keys(week.counts).sort()).toEqual(['all', 'approved', 'pending', 'rejected'])
    test.skip(!week.rows.length, 'company has no employees')
    expect(Object.keys(week.rows[0])).toEqual(
      expect.arrayContaining(['employeeId', 'fullName', 'designation', 'profileImageUrl', 'days', 'total'])
    )
    expect(Object.keys(week.rows[0].days[0]).sort()).toEqual(['date', 'entries', 'hours', 'status'])
  })

  test('TS-API-011 status=ALL bị từ chối (FE bỏ status ở tab Tất cả); ngày tương lai → ATT_032', async ({
    request
  }) => {
    const all = await request.get(`${ATT_URL}attendance/timesheets/week`, {
      headers: auth,
      params: { companyId, date: '2026-02-04', status: 'ALL' }
    })
    expect(all.status()).toBe(400)

    test.skip(!employeeId, 'company has no employees')
    const future = await request.post(`${ATT_URL}attendance/timesheets/entries`, {
      headers: auth,
      data: { employeeId: Number(employeeId), date: '2099-01-01', hours: 1, description: 'E2E' }
    })
    expect(future.status()).toBe(400)
    expect((await future.json()).code).toBe('ATT_032')
  })

  test('TS-API-012 thêm → ngày có mục PENDING; PUT bỏ dự án thì xoá; duyệt → APPROVED; xoá', async ({ request }) => {
    test.skip(!employeeId, 'company has no employees')
    const date = '2025-01-15'
    const created = await request.post(`${ATT_URL}attendance/timesheets/entries`, {
      headers: auth,
      data: { employeeId: Number(employeeId), date, hours: 0.25, project: 'E2E', description: 'E2E entry' }
    })
    expect(created.status()).toBe(200)
    const entry = (await created.json()).data
    try {
      expect(entry.status).toBe('PENDING')
      expect(Number(entry.hours)).toBe(0.25)
      const day = (
        await (
          await request.get(`${ATT_URL}attendance/timesheets/entries`, { headers: auth, params: { employeeId, date } })
        ).json()
      ).data
      expect(day.map((/** @type {any} */ e) => e.id)).toContain(entry.id)

      const updated = await request.put(`${ATT_URL}attendance/timesheets/entries/${entry.id}`, {
        headers: auth,
        data: { employeeId: Number(employeeId), date, hours: 0.5, description: 'E2E entry' }
      })
      expect((await updated.json()).data.project ?? null).toBeNull()

      const approved = await request.put(`${ATT_URL}attendance/timesheets/entries/${entry.id}/approve`, {
        headers: auth,
        data: {}
      })
      expect((await approved.json()).data.status).toBe('APPROVED')
    } finally {
      expect(
        (await request.delete(`${ATT_URL}attendance/timesheets/entries/${entry.id}`, { headers: auth })).status()
      ).toBe(200)
    }
  })
})
