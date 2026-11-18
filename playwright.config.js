// @ts-check
import { existsSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

import { SUPERADMIN_STATE } from './e2e/utils/credentials.js'

// Local credentials for tests against the real backend (HRM_SUPERADMIN / HRM_SUPERADMIN_INITIAL_PASSWORD).
// Loaded into process.env only; never logged. Missing file or variables → those tests skip.
if (existsSync('.env')) process.loadEnvFile('.env')

// UI tests run against a fresh production build served by `vite preview` (same artefact as deploy, no dev-time
// dep optimisation). Needs server.watch.ignored in vite.config.ts — see the comment there.
// Port 4173 so a running `npm run dev` (5173) can stay up. `vite preview` proxies /api → VITE_PROXY_TARGET.
const PORT = 4173
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`
// API tests talk to the backend directly (default: local IAM). Never point this at production.
const apiURL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }]
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    // UI tests with mocked API: <feature>/*.spec.js
    {
      name: 'ui',
      testIgnore: [/.*\.api\.spec\.js/, /.*\.int\.spec\.js/, /.*\.setup\.js/],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    // Real login once, session saved to .auth/ (gitignored — it is a live session)
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    // UI against the real backend: <feature>/*.int.spec.js (backend on VITE_PROXY_TARGET + HRM_SUPERADMIN_*)
    {
      name: 'integration',
      testMatch: /.*\.int\.spec\.js/,
      dependencies: ['setup'],
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: SUPERADMIN_STATE }
    },
    // Backend contract tests: <feature>/*.api.spec.js (need the backend running). They reuse the token of the single
    // real login done by "setup" — never log in per file (parallel logins gave AUTH_001 and risk an account lockout).
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
      dependencies: ['setup'],
      use: { baseURL: apiURL, extraHTTPHeaders: { 'Accept-Language': 'vi' } }
    }
  ],
  webServer: {
    // Always rebuild: reusing a running preview would test a stale build
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000
  }
})
