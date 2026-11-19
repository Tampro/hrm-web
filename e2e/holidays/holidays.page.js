// @ts-check
// Page object for Holidays (list, calendar, dialogs). Locators + actions only; labels = vi.json.

export class HolidaysPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.clearButton = page.getByRole('button', { name: /^Xoá bộ lọc/ })
    this.addButton = page.getByRole('button', { name: 'Thêm ngày lễ' })
    this.categoriesButton = page.getByRole('button', { name: 'Loại ngày lễ' })
    this.calendar = page.getByRole('region', { name: 'Lịch ngày lễ' })
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [query] e.g. '?companyId=2' */
  async goto(query = '') {
    await this.page.goto(`/dashboard/holidays${query}`)
  }

  /** @param {string} label */
  field(label) {
    return this.dialog.getByRole('textbox', { name: label, exact: true })
  }

  /** @param {string} name */
  row(name) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  /**
   * @param {string} combobox label
   * @param {string} option
   * @param {import('@playwright/test').Locator | import('@playwright/test').Page} [scope]
   */
  async choose(combobox, option, scope = this.page) {
    await scope.getByRole('combobox', { name: combobox, exact: true }).click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }

  /**
   * Day picker of a field: opens it and picks a day of the shown month.
   * @param {string} label
   * @param {number} day
   * @param {import('@playwright/test').Locator | import('@playwright/test').Page} [scope]
   */
  async pickDay(label, day, scope = this.page) {
    await scope.getByRole('button', { name: label }).first().click()
    await this.page
      .getByRole('grid')
      .last()
      .getByRole('button')
      .filter({ hasText: new RegExp(`^${day}$`) })
      .first()
      .click()
  }
}
