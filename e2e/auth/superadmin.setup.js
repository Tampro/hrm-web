// @ts-check
// Real UI login as super admin, session saved for the "integration" project.
import { expect, test as setup } from '@playwright/test'

import { getSuperAdmin, MISSING_SUPERADMIN, SUPERADMIN_STATE } from '../utils/credentials.js'
import { LoginPage } from './login.page.js'

setup('AUTH-INT-000 đăng nhập thật bằng super admin và lưu phiên', async ({ page }) => {
  const creds = getSuperAdmin()
  setup.skip(!creds, MISSING_SUPERADMIN)
  if (!creds) return
  const loginPage = new LoginPage(page)
  await loginPage.goto()

  await loginPage.login(creds.username, creds.password)

  // assert the login really succeeded before saving the session
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('link', { name: 'Công ty' })).toBeVisible()
  await page.context().storageState({ path: SUPERADMIN_STATE })
})
