// @ts-check
// Shared fixtures for every feature. Feature specs import { test, expect } from here, not from '@playwright/test'.
import { test as base, expect } from '@playwright/test'

import { LoginPage } from '../auth/login.page.js'
import { CompaniesPage } from '../companies/companies.page.js'
import { CouponsPage } from '../coupons/coupons.page.js'
import { CurrenciesPage } from '../currencies/currencies.page.js'
import { ReferralPage } from '../referral/referral.page.js'
import { SettingsPage } from '../settings/settings.page.js'
import { PlansPage, SaasListPage } from '../plans/plans.page.js'
import { mockApi } from '../utils/mock-api.js'

/**
 * @typedef {Object} HrmFixtures
 * @property {LoginPage} loginPage
 * @property {CompaniesPage} companiesPage
 * @property {CouponsPage} couponsPage
 * @property {CurrenciesPage} currenciesPage
 * @property {ReferralPage} referralPage
 * @property {SettingsPage} settingsPage
 * @property {PlansPage} plansPage
 * @property {SaasListPage} saasListPage
 * @property {ReturnType<typeof mockApi>} api  Helpers to stub backend responses (register before page.goto)
 */

/** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & HrmFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  companiesPage: async ({ page }, use) => {
    await use(new CompaniesPage(page))
  },
  couponsPage: async ({ page }, use) => {
    await use(new CouponsPage(page))
  },
  currenciesPage: async ({ page }, use) => {
    await use(new CurrenciesPage(page))
  },
  referralPage: async ({ page }, use) => {
    await use(new ReferralPage(page))
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page))
  },
  plansPage: async ({ page }, use) => {
    await use(new PlansPage(page))
  },
  saasListPage: async ({ page }, use) => {
    await use(new SaasListPage(page))
  },
  api: async ({ page }, use) => {
    await use(mockApi(page))
  }
})

export { expect }
