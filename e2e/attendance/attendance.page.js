// @ts-check
// Page object for Shifts and Attendance policies (same list layout). Locators + actions only; labels = vi.json.

export class AttendanceSetupPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {'shifts' | 'policies'} path
   */
  constructor(page, path) {
    this.page = page
    this.path = path
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [query] e.g. '?companyId=2' */
  async goto(query = '') {
    await this.page.goto(`/dashboard/attendance/${this.path}${query}`)
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
   */
  async choose(combobox, option) {
    await this.page.getByRole('combobox', { name: combobox, exact: true }).click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }
}
