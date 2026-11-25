// @ts-check
// Feature: attendance records — backend contract tests against the real attendance-service (project "api").
// The one record created here is deleted in the same test. Spec sources: AttendanceRecordController, RecordDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const ATT_URL = process.env.E2E_ATTENDANCE_API_URL || 'http://localhost:8084/api/v1/'
const EMP_URL = process.env.E2E_EMPLOYEE_API_URL || 'http://localhost:8083/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Attendance records API', () => {
  test('REC-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${ATT_URL}attendance/records/calendar?year=2026&month=2`)).status()).toBe(401)
  })
})

test.describe('Attendance records API · super admin', () => {
  test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)

  /** @type {Record<string, string>} */
  let auth = {}
  let companyId = ''
  test.beforeAll(async ({ playwright }) => {
    auth = { Authorization: `Bearer ${readSuperAdminToken()}` }
    const ctx = await playwright.request.newContext()
    const companies = (await (await ctx.get(`${IAM_URL}iam/companies`, { headers: auth, params: { size: 50 } })).json())
      .data.content
    // the first active company that has an employee (the calendar has one row per employee)
    for (const c of companies.filter((/** @type {any} */ c) => c.status === 'ACTIVE')) {
      const res = await ctx.get(`${EMP_URL}employees`, { headers: auth, params: { companyId: c.id, size: 1 } })
      companyId ||= c.id
      if ((await res.json()).data?.content?.length) {
        companyId = c.id
        break
      }
    }
    await ctx.dispose()
  })

  test('REC-API-010 lịch tháng: Calendar / EmployeeRow / DayCell đúng trường FE dùng', async ({ request }) => {
    const res = await request.get(`${ATT_URL}attendance/records/calendar`, {
      headers: auth,
      params: { companyId, year: 2026, month: 2, page: 0, size: 5 }
    })
    expect(res.status()).toBe(200)
    const cal = (await res.json()).data
    expect(Object.keys(cal).sort()).toEqual(
      ['month', 'page', 'rows', 'size', 'today', 'totalElements', 'weeklyOffDays', 'year'].sort()
    )
    test.skip(!cal.rows.length, 'company has no employees')
    expect(Object.keys(cal.rows[0])).toEqual(
      expect.arrayContaining([
        'employeeId',
        'fullName',
        'employeeCode',
        'designation',
        'days',
        'attended',
        'workingDays'
      ])
    )
    const cellKeys = ['date', 'status', 'weekend', 'late', 'earlyDeparture', 'overtime', 'clockIn', 'clockOut', 'notes']
    expect(Object.keys(cal.rows[0].days[0])).toEqual(expect.arrayContaining([...cellKeys, 'recordId']))
  })

  test('REC-API-011 thiếu companyId (super admin) → 400 ATT_004; giờ ra không có giờ vào → 400 ATT_010', async ({
    request
  }) => {
    const noCompany = await request.get(`${ATT_URL}attendance/records/calendar`, {
      headers: auth,
      params: { year: 2026, month: 2 }
    })
    expect(noCompany.status()).toBe(400)
    expect((await noCompany.json()).code).toBe('ATT_004')

    const employees = (
      await (await request.get(`${EMP_URL}employees`, { headers: auth, params: { companyId, size: 1 } })).json()
    ).data.content
    test.skip(!employees.length, 'company has no employees')
    const res = await request.post(`${ATT_URL}attendance/records`, {
      headers: auth,
      data: { employeeId: Number(employees[0].id), date: '2026-02-04', clockOut: '17:00' }
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).code).toBe('ATT_010')
  })

  test('REC-API-012 thêm → ô lịch có recordId; PUT thay toàn bộ xoá ghi chú; xoá → ô về NOT_ADDED', async ({
    request
  }) => {
    const employees = (
      await (await request.get(`${EMP_URL}employees`, { headers: auth, params: { companyId, size: 1 } })).json()
    ).data.content
    test.skip(!employees.length, 'company has no employees')
    const employeeId = employees[0].id
    const date = '2025-01-15'
    const cellOf = async () => {
      const cal = (
        await (
          await request.get(`${ATT_URL}attendance/records/calendar`, {
            headers: auth,
            params: { companyId, year: 2025, month: 1, employeeId }
          })
        ).json()
      ).data
      return cal.rows[0].days.find((/** @type {any} */ d) => d.date === date)
    }
    test.skip(!!(await cellOf())?.recordId, 'a record already exists on the test day')

    const created = await request.post(`${ATT_URL}attendance/records`, {
      headers: auth,
      data: { employeeId: Number(employeeId), date, clockIn: '08:00', clockOut: '17:00', notes: 'E2E' }
    })
    expect(created.status()).toBe(200)
    const record = (await created.json()).data
    try {
      expect((await cellOf()).recordId).toBe(record.id)

      const updated = await request.put(`${ATT_URL}attendance/records/${record.id}`, {
        headers: auth,
        data: { employeeId: Number(employeeId), date, clockIn: '08:00', clockOut: '17:00' }
      })
      expect((await updated.json()).data.notes ?? null).toBeNull()
    } finally {
      expect((await request.delete(`${ATT_URL}attendance/records/${record.id}`, { headers: auth })).status()).toBe(200)
    }
    expect((await cellOf()).recordId ?? null).toBeNull()
  })
})
