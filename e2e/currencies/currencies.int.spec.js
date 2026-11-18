// @ts-check
// Feature: currencies — UI against the REAL backend (project "integration", session from superadmin.setup.js).
// Writes data: creates one temporary currency (never the default — that would change how every price is shown),
// edits it, views it, then deletes it (permanent). The code is picked among unused 3-letter codes.
import { expect, test } from '../fixtures/index.js'
import { getSuperAdmin, MISSING_SUPERADMIN, readSuperAdminToken } from '../utils/credentials.js'
import { waitForListResponse } from '../utils/wait-for.js'

test.skip(!getSuperAdmin(), MISSING_SUPERADMIN)
test.describe.configure({ mode: 'serial' })

const STAMP = Date.now().toString().slice(-6)
const NAME = `E2E Currency ${STAMP}`
/** Filled in the first test: an unused code from the backend list */
let CODE = ''

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} method
 * @param {RegExp} path
 */
const nextCall = (page, method, path) =>
  page.waitForResponse((r) => r.request().method() === method && path.test(new URL(r.url()).pathname))

/**
 * @param {import('./currencies.page.js').CurrenciesPage} currenciesPage
 * @param {string} keyword
 */
const searchFor = async (currenciesPage, keyword) => {
  const list = waitForListResponse(currenciesPage.page, '/api/v1/saas/admin/currencies', { keyword })
  await currenciesPage.keyword.fill(keyword)
  await currenciesPage.searchButton.click()
  return (await (await list).json()).data
}

test.describe('Tiền tệ · backend thật', () => {
  test('CUR-INT-001 tạo tiền tệ thật (không mặc định)', async ({ page, request, currenciesPage }) => {
    const apiURL = process.env.E2E_API_URL || 'http://localhost:8081/api/v1/'
    const existing = await request.get(`${apiURL}saas/admin/currencies`, {
      headers: { Authorization: `Bearer ${readSuperAdminToken()}` },
      params: { size: 500 }
    })
    const used = new Set((await existing.json()).data.content.map((/** @type {any} */ c) => c.code))
    // Q?? codes: few real ones (QAR); try a deterministic sequence until one is free
    for (const a of 'ZYXWVU') for (const b of 'ZYXWVU') if (!CODE && !used.has(`Q${a}${b}`)) CODE = `Q${a}${b}`
    expect(CODE, 'no free Q?? code').not.toBe('')

    await currenciesPage.goto()
    await currenciesPage.addButton.click()
    await currenciesPage.field('Tên tiền tệ').fill(NAME)
    await currenciesPage.field('Mã tiền tệ').fill(CODE)
    await currenciesPage.field('Ký hiệu').fill('Q$')
    const created = nextCall(page, 'POST', /\/api\/v1\/saas\/admin\/currencies$/)

    await currenciesPage.dialog.getByRole('button', { name: 'Tạo tiền tệ' }).click()

    const body = await (await created).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data).toEqual(expect.objectContaining({ code: CODE, symbol: 'Q$', defaultCurrency: false }))
    const found = await searchFor(currenciesPage, CODE)
    expect(found.totalElements).toBe(1)
    await expect(currenciesPage.row(NAME)).toContainText('Không')
  })

  test('CUR-INT-002 mã trùng: SAAS_023', async ({ page, currenciesPage }) => {
    await currenciesPage.goto()
    await currenciesPage.addButton.click()
    await currenciesPage.field('Tên tiền tệ').fill(`${NAME} dup`)
    await currenciesPage.field('Mã tiền tệ').fill(CODE)
    const created = nextCall(page, 'POST', /\/api\/v1\/saas\/admin\/currencies$/)

    await currenciesPage.dialog.getByRole('button', { name: 'Tạo tiền tệ' }).click()

    const body = await (await created).json()
    expect(body.code).toBe('SAAS_023')
    await expect(currenciesPage.toast).toContainText(body.message)
  })

  test('CUR-INT-003 sửa: xoá ký hiệu (PUT thay toàn bộ → null), thêm mô tả; xem chi tiết', async ({
    page,
    currenciesPage
  }) => {
    await currenciesPage.goto()
    await searchFor(currenciesPage, CODE)
    await currenciesPage
      .row(NAME)
      .getByRole('button', { name: `Sửa ${NAME}` })
      .click()
    await currenciesPage.field('Ký hiệu').fill('')
    await currenciesPage.field('Mô tả').fill('E2E temporary currency')
    const updated = nextCall(page, 'PUT', /\/api\/v1\/saas\/admin\/currencies\/\d+$/)

    await currenciesPage.dialog.getByRole('button', { name: 'Lưu' }).click()

    const body = await (await updated).json()
    expect(body.result, `${body.code} ${body.message}`).toBe(true)
    expect(body.data).toEqual(
      expect.objectContaining({ symbol: null, description: 'E2E temporary currency', defaultCurrency: false })
    )

    await currenciesPage
      .row(NAME)
      .getByRole('button', { name: `Xem ${NAME}` })
      .click()
    await expect(currenciesPage.dialog).toContainText('E2E temporary currency')
  })

  test('CUR-INT-004 xoá vĩnh viễn: không còn trong danh sách', async ({ page, currenciesPage }) => {
    await currenciesPage.goto()
    await searchFor(currenciesPage, CODE)
    await currenciesPage
      .row(NAME)
      .getByRole('button', { name: `Xoá ${NAME}` })
      .click()
    const deleted = nextCall(page, 'DELETE', /\/api\/v1\/saas\/admin\/currencies\/\d+$/)
    const list = nextCall(page, 'GET', /\/api\/v1\/saas\/admin\/currencies$/)

    await currenciesPage.alertDialog.getByRole('button', { name: 'Xoá' }).click()

    expect((await deleted).ok()).toBe(true)
    expect((await (await list).json()).data.totalElements).toBe(0)
  })
})
