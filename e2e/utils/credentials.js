// @ts-check
// Real-backend credentials from the environment (.env is loaded by playwright.config.js):
//   HRM_SUPERADMIN                   super admin username
//   HRM_SUPERADMIN_INITIAL_PASSWORD  its password (already changed from the temporary one)
// Never log these values, never put them in test titles, attachments or assertion messages.
//
// The whole run logs in for real exactly ONCE (auth/superadmin.setup.js → .auth/superadmin.json).
// Parallel logins got intermittent AUTH_001 and failed logins can lock the account, so API specs reuse that session.
import { existsSync, readFileSync } from 'node:fs'

export const SUPERADMIN_STATE = '.auth/superadmin.json'

/** @returns {{ username: string, password: string } | null} */
export const getSuperAdmin = () => {
  const username = process.env.HRM_SUPERADMIN
  const password = process.env.HRM_SUPERADMIN_INITIAL_PASSWORD
  return username && password ? { username, password } : null
}

export const MISSING_SUPERADMIN = 'HRM_SUPERADMIN / HRM_SUPERADMIN_INITIAL_PASSWORD not set'

/**
 * Access token from the session saved by the setup project (cookie `token`). Throws when setup did not run.
 * @returns {string}
 */
export const readSuperAdminToken = () => {
  if (!existsSync(SUPERADMIN_STATE)) throw new Error(`${SUPERADMIN_STATE} missing — the "setup" project must run first`)
  const state = JSON.parse(readFileSync(SUPERADMIN_STATE, 'utf8'))
  const token = state.cookies?.find((/** @type {{ name: string }} */ c) => c.name === 'token')?.value
  if (!token) throw new Error(`No access token in ${SUPERADMIN_STATE}`)
  return token
}
