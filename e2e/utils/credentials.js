// @ts-check
// Real-backend credentials from the environment (.env is loaded by playwright.config.js):
//   HRM_SUPERADMIN                   super admin username
//   HRM_SUPERADMIN_INITIAL_PASSWORD  its password (already changed from the temporary one)
// Never log these values, never put them in test titles, attachments or assertion messages.

/** @returns {{ username: string, password: string } | null} */
export const getSuperAdmin = () => {
  const username = process.env.HRM_SUPERADMIN
  const password = process.env.HRM_SUPERADMIN_INITIAL_PASSWORD
  return username && password ? { username, password } : null
}

export const MISSING_SUPERADMIN = 'HRM_SUPERADMIN / HRM_SUPERADMIN_INITIAL_PASSWORD not set'

/**
 * Logs in through the API and returns an access token (for *.api.spec.js).
 * @param {import('@playwright/test').APIRequestContext} request
 */
export const loginSuperAdmin = async (request) => {
  const creds = getSuperAdmin()
  if (!creds) throw new Error(MISSING_SUPERADMIN)
  const res = await request.post('auth/login', { data: creds })
  if (!res.ok()) throw new Error(`Super admin login failed: HTTP ${res.status()} ${(await res.json()).code}`)
  return /** @type {string} */ ((await res.json()).data.accessToken)
}
