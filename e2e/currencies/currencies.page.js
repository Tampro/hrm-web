// @ts-check
// Page object for the Currencies page. Locators + actions only; labels = vi.json.

export class CurrenciesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.addButton = page.getByRole('button', { name: 'Thêm tiền tệ' })
    this.keyword = page.getByLabel('Từ khoá')
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.clearButton = page.getByRole('button', { name: 'Xoá bộ lọc' })
    this.table = page.getByRole('table')
    this.rows = page.getByRole('table').locator('tbody tr')
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  async goto(query = '') {
    await this.page.goto(`/dashboard/currencies${query}`)
  }

  /** @param {string} text */
  row(text) {
    return this.rows.filter({ hasText: text })
  }

  /** @param {string} label */
  field(label) {
    return this.dialog.getByRole('textbox', { name: label, exact: true })
  }
}
