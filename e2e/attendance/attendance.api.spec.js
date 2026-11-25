// @ts-check
// Feature: shifts + attendance policies — backend contract tests against the real attendance-service (project "api").
// Every record created here is deleted in the same test. Spec sources: ShiftController, AttendancePolicyController,
// ShiftDtos, AttendancePolicyDtos.
import { expect, test } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'

const ATT_URL = process.env.E2E_ATTENDANCE_API_URL || 'http://localhost:8084/api/v1/'
const IAM_URL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

test.describe('Attendance setup API', () => {
  test('ATT-API-001 không có token → 401', async ({ request }) => {
    expect((await request.get(`${ATT_URL}attendance/shifts`)).status()).toBe(401)
    expect((await request.get(`${ATT_URL}attendance/policies`)).status()).toBe(401)
  })
})

test.describe('Attendance setup API · super admin', () => {
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

  test('ATT-API-010 ca: tạo ca đêm → DTO đủ trường, workingMinutes qua nửa đêm; lọc nightShift; xoá', async ({
    request
  }) => {
    const name = `E2E shift ${Date.now()}`
    const created = await request.post(`${ATT_URL}attendance/shifts`, {
      headers: auth,
      params: { companyId },
      data: {
        name,
        startTime: '22:00',
        endTime: '06:00',
        breakDurationMinutes: 30,
        gracePeriodMinutes: 10,
        nightShift: true
      }
    })
    expect(created.status()).toBe(200)
    const shift = (await created.json()).data
    try {
      expect(Object.keys(shift)).toEqual(
        expect.arrayContaining([
          'id',
          'name',
          'description',
          'startTime',
          'endTime',
          'breakDurationMinutes',
          'breakStartTime',
          'breakEndTime',
          'gracePeriodMinutes',
          'nightShift',
          'workingMinutes',
          'status'
        ])
      )
      // 22:00 → 06:00 = 480 min, minus 30 min break
      expect(shift.workingMinutes).toBe(450)
      expect(shift.startTime.slice(0, 5)).toBe('22:00')
      expect(shift.status).toBe('ACTIVE')

      const night = await request.get(`${ATT_URL}attendance/shifts`, {
        headers: auth,
        params: { companyId, nightShift: true, keyword: name }
      })
      const rows = (await night.json()).data.content
      expect(rows.map((/** @type {any} */ r) => r.id)).toContain(shift.id)

      const counts = (
        await (
          await request.get(`${ATT_URL}attendance/shifts/status-counts`, { headers: auth, params: { companyId } })
        ).json()
      ).data
      expect(Object.keys(counts).sort()).toEqual(['active', 'all', 'inactive'])
      const summary = (
        await (
          await request.get(`${ATT_URL}attendance/shifts/summary`, { headers: auth, params: { companyId } })
        ).json()
      ).data
      expect(Object.keys(summary).sort()).toEqual(['active', 'day', 'night', 'total'])

      const status = await request.put(`${ATT_URL}attendance/shifts/${shift.id}/status`, {
        headers: auth,
        data: { status: 'INACTIVE' }
      })
      expect((await status.json()).data.status).toBe('INACTIVE')
    } finally {
      expect((await request.delete(`${ATT_URL}attendance/shifts/${shift.id}`, { headers: auth })).status()).toBe(200)
    }
  })

  test('ATT-API-011 status=ALL bị từ chối (FE bỏ status ở tab Tất cả)', async ({ request }) => {
    const res = await request.get(`${ATT_URL}attendance/shifts`, {
      headers: auth,
      params: { companyId, status: 'ALL' }
    })
    expect(res.status()).toBe(400)
  })

  test('ATT-API-020 chính sách: mặc định 15 / 15 phút, 4 giờ khi bỏ trống; PUT thay toàn bộ; xoá', async ({
    request
  }) => {
    const name = `E2E policy ${Date.now()}`
    const created = await request.post(`${ATT_URL}attendance/policies`, {
      headers: auth,
      params: { companyId },
      data: { name, description: 'tmp', overtimeRatePerHour: 50000 }
    })
    expect(created.status()).toBe(200)
    const policy = (await created.json()).data
    try {
      expect(policy.lateArrivalGraceMinutes).toBe(15)
      expect(policy.earlyDepartureGraceMinutes).toBe(15)
      expect(Number(policy.halfDayThresholdHours)).toBe(4)

      const updated = await request.put(`${ATT_URL}attendance/policies/${policy.id}`, {
        headers: auth,
        data: {
          name,
          lateArrivalGraceMinutes: 5,
          earlyDepartureGraceMinutes: 5,
          halfDayThresholdHours: 4.5,
          overtimeRatePerHour: 60000
        }
      })
      const body = (await updated.json()).data
      expect(body.description ?? null).toBeNull()
      expect(Number(body.halfDayThresholdHours)).toBe(4.5)

      const summary = (
        await (
          await request.get(`${ATT_URL}attendance/policies/summary`, { headers: auth, params: { companyId } })
        ).json()
      ).data
      expect(Object.keys(summary)).toEqual(
        expect.arrayContaining(['total', 'active', 'avgLateArrivalGraceMinutes', 'avgOvertimeRatePerHour'])
      )
    } finally {
      expect((await request.delete(`${ATT_URL}attendance/policies/${policy.id}`, { headers: auth })).status()).toBe(200)
    }
  })
})
