// @ts-check
// Shared fixtures for every feature. Feature specs import { test, expect } from here, not from '@playwright/test'.
import { test as base, expect } from '@playwright/test'

import { LoginPage } from '../auth/login.page.js'
import { mockApi } from '../utils/mock-api.js'

/**
 * @typedef {Object} HrmFixtures
 * @property {LoginPage} loginPage
 * @property {ReturnType<typeof mockApi>} api  Helpers to stub backend responses (register before page.goto)
 */

/** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & HrmFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  api: async ({ page }, use) => {
    await use(mockApi(page))
  }
})

export { expect }
