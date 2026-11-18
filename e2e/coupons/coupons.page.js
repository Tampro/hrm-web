// @ts-check
// Page object for the Coupons list + detail. Locators + actions only; labels = vi.json.

export class CouponsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.addButton = page.getByRole('button', { name: 'Thêm mã giảm giá' })
    this.keyword = page.getByLabel('Từ khoá')
    this.typeFilter = page.getByRole('combobox', { name: 'Loại giảm giá' })
    this.searchButton = page.getByRole('button', { name: /^Tìm kiếm/ })
    this.clearButton = page.getByRole('button', { name: 'Xoá bộ lọc' })
    this.table = page.getByRole('table')
    this.rows = page.getByRole('table').first().locator('tbody tr')
    this.showing = page.getByText(/^Hiển thị \d+ \/ \d+$/)
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [suffix] '' | '/301' */
  async goto(suffix = '', query = '') {
    await this.page.goto(`/dashboard/coupons${suffix}${query}`)
  }

  /** @param {string} name e.g. 'Hoạt động' */
  statusTab(name) {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}`) })
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
