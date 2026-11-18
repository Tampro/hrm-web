// @ts-check
// Page object for System settings. Locators + actions only; labels = vi.json.

export class SettingsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.menu = page.getByRole('navigation', { name: 'Các mục cài đặt' })
    this.saveButton = page.getByRole('button', { name: 'Lưu thay đổi' })
    this.toast = page.locator('[data-sonner-toast]')
    this.dialog = page.getByRole('dialog')
  }

  /** @param {string} [section] e.g. 'system', 'email' */
  async goto(section = '') {
    await this.page.goto(`/dashboard/settings${section ? `/${section}` : ''}`)
  }

  /** @param {string} label */
  field(label) {
    return this.page.getByRole('textbox', { name: label, exact: true })
  }

  /** @param {string} label */
  select(label) {
    return this.page.getByRole('combobox', { name: label, exact: true })
  }

  /** @param {string} label */
  switchOf(label) {
    return this.page.getByRole('switch', { name: label })
  }

  /**
   * @param {string} label combobox label
   * @param {string} option option text
   */
  async choose(label, option) {
    await this.select(label).click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }
}
