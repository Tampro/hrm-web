// @ts-check
// Page object for Announcements (list, dashboard, detail, statistics). Locators + actions only; labels = vi.json.

export class AnnouncementsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.clearButton = page.getByRole('button', { name: /^Xoá bộ lọc/ })
    this.addButton = page.getByRole('button', { name: 'Thêm thông báo' })
    this.categoriesButton = page.getByRole('button', { name: 'Loại thông báo' })
    this.views = page.getByRole('group', { name: 'Chế độ xem' })
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [path] e.g. '?companyId=2', '/5', '/5/statistics' */
  async goto(path = '') {
    await this.page.goto(`/dashboard/announcements${path}`)
  }

  /** @param {string} label */
  field(label) {
    return this.dialog.getByRole('textbox', { name: label, exact: true })
  }

  /** @param {string} title */
  row(title) {
    return this.page.getByRole('row').filter({ hasText: title })
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
