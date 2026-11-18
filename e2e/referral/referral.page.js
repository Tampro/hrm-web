// @ts-check
// Page object for the Referral section. Locators + actions only; labels = vi.json.

export class ReferralPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByLabel('Từ khoá')
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.clearButton = page.getByRole('button', { name: 'Xoá bộ lọc' })
    this.table = page.getByRole('table').first()
    this.rows = page.getByRole('table').first().locator('tbody tr')
    this.dialog = page.getByRole('dialog')
    this.toast = page.locator('[data-sonner-toast]')
    this.saveButton = page.getByRole('button', { name: 'Lưu cài đặt' })
  }

  /** @param {'' | '/referred' | '/payouts' | '/settings'} [path] */
  async goto(path = '', query = '') {
    await this.page.goto(`/dashboard/referral${path}${query}`)
  }

  /** @param {string} name section tab or status tab */
  tab(name) {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}`) })
  }

  /** @param {string} label */
  cards(label) {
    return this.page.getByRole('region', { name: label })
  }

  /** @param {string} text */
  row(text) {
    return this.rows.filter({ hasText: text })
  }

  /** @param {string} label */
  field(label) {
    return this.page.getByRole('textbox', { name: label })
  }
}
