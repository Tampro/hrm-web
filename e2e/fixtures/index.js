// @ts-check
// Shared fixtures for every feature. Feature specs import { test, expect } from here, not from '@playwright/test'.
import { test as base, expect } from '@playwright/test'

import { LoginPage } from '../auth/login.page.js'
import { CompaniesPage } from '../companies/companies.page.js'
import { CouponsPage } from '../coupons/coupons.page.js'
import { CurrenciesPage } from '../currencies/currencies.page.js'
import { ReferralPage } from '../referral/referral.page.js'
import { AnnouncementsPage } from '../announcements/announcements.page.js'
import { AwardTypesPage } from '../award-types/award-types.page.js'
import { BranchesPage } from '../branches/branches.page.js'
import { DepartmentsPage } from '../departments/departments.page.js'
import { DesignationsPage } from '../designations/designations.page.js'
import { AttendanceSetupPage } from '../attendance/attendance.page.js'
import { DocumentTypesPage } from '../document-types/document-types.page.js'
import { HolidaysPage } from '../holidays/holidays.page.js'
import { EmailTemplatesPage } from '../email-templates/email-templates.page.js'
import { EmployeesPage } from '../employees/employees.page.js'
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
 * @property {EmailTemplatesPage} emailTemplatesPage
 * @property {EmployeesPage} employeesPage
 * @property {BranchesPage} branchesPage
 * @property {DepartmentsPage} departmentsPage
 * @property {DesignationsPage} designationsPage
 * @property {HolidaysPage} holidaysPage
 * @property {AnnouncementsPage} announcementsPage
 * @property {AwardTypesPage} awardTypesPage
 * @property {DocumentTypesPage} documentTypesPage
 * @property {AttendanceSetupPage} shiftsPage
 * @property {AttendanceSetupPage} attendancePoliciesPage
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
  emailTemplatesPage: async ({ page }, use) => {
    await use(new EmailTemplatesPage(page))
  },
  employeesPage: async ({ page }, use) => {
    await use(new EmployeesPage(page))
  },
  branchesPage: async ({ page }, use) => {
    await use(new BranchesPage(page))
  },
  departmentsPage: async ({ page }, use) => {
    await use(new DepartmentsPage(page))
  },
  designationsPage: async ({ page }, use) => {
    await use(new DesignationsPage(page))
  },
  holidaysPage: async ({ page }, use) => {
    await use(new HolidaysPage(page))
  },
  announcementsPage: async ({ page }, use) => {
    await use(new AnnouncementsPage(page))
  },
  awardTypesPage: async ({ page }, use) => {
    await use(new AwardTypesPage(page))
  },
  documentTypesPage: async ({ page }, use) => {
    await use(new DocumentTypesPage(page))
  },
  shiftsPage: async ({ page }, use) => {
    await use(new AttendanceSetupPage(page, 'shifts'))
  },
  attendancePoliciesPage: async ({ page }, use) => {
    await use(new AttendanceSetupPage(page, 'policies'))
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
