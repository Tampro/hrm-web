// @ts-check
// Stubs for the backend envelope { result, code, data, message, traceId } (Spec: ApiMessageDto, IAM Swagger).
// Mock only what the test needs; prefer the real backend when the scenario can be reached with it.

const API_PREFIX = '/api/v1'

/** @param {unknown} data */
export const ok = (data) => ({ result: true, code: 'SUCCESS', data, message: null, traceId: 'e2e-trace' })

/**
 * @param {string} code
 * @param {string} message
 */
export const fail = (code, message) => ({ result: false, code, data: null, message, traceId: 'e2e-trace' })

/**
 * Spec: ResponseListDto
 * @param {unknown[]} content
 * @param {{ page?: number, size?: number, totalElements?: number }} [paging]
 */
export const pageOf = (content, { page = 0, size = 10, totalElements = content.length } = {}) => ({
  content,
  page,
  size,
  totalElements,
  totalPages: Math.ceil(totalElements / size),
  last: (page + 1) * size >= totalElements
})

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

/** Fake super admin (Spec: MeDto.superAdmin) */
export const FAKE_SUPER_ADMIN = {
  ...FAKE_ME,
  userId: '9000',
  username: 'e2e.superadmin',
  companyId: null,
  superAdmin: true
}

/**
 * @typedef {Object} CapturedRequest
 * @property {string} method
 * @property {URLSearchParams} query
 * @property {any} body
 */

/** @param {import('@playwright/test').Page} page */
export const mockApi = (page) => {
  /**
   * Stub one endpoint (exact path, any query string). Later registrations win over earlier ones.
   * Returns the list of captured requests so tests can assert params / payloads.
   * @param {string} path  path after /api/v1, e.g. '/auth/login' or '/iam/companies/1/status'
   * @param {{ status?: number, body: unknown | ((req: CapturedRequest) => unknown), method?: string }} response
   * @returns {Promise<CapturedRequest[]>}
   */
  const route = async (path, { status = 200, body, method }) => {
    /** @type {CapturedRequest[]} */
    const calls = []
    await page.route(
      (url) => url.pathname === `${API_PREFIX}${path}`,
      (r) => {
        const request = r.request()
        if (method && request.method() !== method) return r.fallback()
        const captured = {
          method: request.method(),
          query: new URL(request.url()).searchParams,
          body: request.postDataJSON()
        }
        calls.push(captured)
        const payload = typeof body === 'function' ? body(captured) : body
        return r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) })
      }
    )
    return calls
  }

  return {
    route,
    /**
     * Signed-in session: fake token cookies + GET /me.
     * @param {string} baseURL
     * @param {object} [me]
     */
    signIn: async (baseURL, me = FAKE_ME) => {
      await page.context().addCookies([
        { name: 'token', value: FAKE_TOKEN.accessToken, url: baseURL },
        { name: 'refreshToken', value: FAKE_TOKEN.refreshToken, url: baseURL }
      ])
      await route('/me', { body: ok(me) })
    }
  }
}
