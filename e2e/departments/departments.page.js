// @ts-check
// Page object for Departments. Locators + actions only; labels = vi.json.

export class DepartmentsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.addButton = page.getByRole('button', { name: 'Thêm phòng ban' })
    this.panel = page.getByRole('complementary', { name: 'Phòng ban đang chọn' })
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [query] e.g. '?companyId=2' */
  async goto(query = '') {
    await this.page.goto(`/dashboard/departments${query}`)
  }

  /** @param {string} label */
  field(label) {
    return this.dialog.getByRole('textbox', { name: label, exact: true })
  }

  /** @param {string} label */
  tab(label) {
    return this.page.getByRole('tab', { name: new RegExp(`^${label}`) })
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
}
