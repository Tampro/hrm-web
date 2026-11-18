// @ts-check
// Stubs for the backend envelope { result, code, data, message, traceId } (Spec: ApiMessageDto, IAM Swagger).
// Mock only what the test needs; prefer the real backend when the scenario can be reached with it.

const API = '**/api/v1'

/** @param {unknown} data */
export const ok = (data) => ({ result: true, code: 'SUCCESS', data, message: null, traceId: 'e2e-trace' })

/**
 * @param {string} code
 * @param {string} message
 */
export const fail = (code, message) => ({ result: false, code, data: null, message, traceId: 'e2e-trace' })

/** Obviously fake token pair — never a real token */
export const FAKE_TOKEN = {
  accessToken: 'e2e-access-token',
  refreshToken: 'e2e-refresh-token',
  expiresIn: 900,
  refreshExpiresIn: 604800
}

/** Fake current user (Spec: MeDto) */
export const FAKE_ME = {
  userId: '9001',
  username: 'e2e.tester',
  companyId: '1',
  superAdmin: false,
  roles: ['E2E_ROLE'],
  permissions: []
}

/** @param {import('@playwright/test').Page} page */
export const mockApi = (page) => ({
  /**
   * Stub one endpoint.
   * @param {string} path  path after /api/v1, e.g. '/auth/login'
   * @param {{ status?: number, body: unknown }} response
   */
  route: async (path, { status = 200, body }) => {
    await page.route(`${API}${path}`, (route) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    )
  }
})
