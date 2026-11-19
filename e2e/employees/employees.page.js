// @ts-check
// Page object for Employees (list, wizard, profile, org chart). Locators + actions only; labels = vi.json.

export class EmployeesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.companyPicker = page.getByRole('combobox', { name: 'Công ty', exact: true })
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.addLink = page.getByRole('link', { name: 'Thêm nhân viên' })
    this.nextButton = page.getByRole('button', { name: 'Tiếp tục' })
    this.toast = page.locator('[data-sonner-toast]')
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.actionsMenu = page.getByRole('button', { name: 'Thao tác khác' })
  }

  /** @param {string} [path] e.g. '?companyId=2', '/create?companyId=2', '/5' */
  async goto(path = '') {
    await this.page.goto(`/dashboard/employees${path}`)
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
  tab(label) {
    return this.page.getByRole('tab', { name: new RegExp(`^${label}`) })
  }

  /**
   * @param {string} label combobox label
   * @param {string} option option text
   */
  async choose(label, option) {
    await this.select(label).click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }

  /**
   * Day picker: opens the calendar of the field and picks a day of the shown month.
   * @param {string} label
   * @param {number} day
   */
  async pickDay(label, day) {
    await this.page.getByRole('button', { name: label }).first().click()
    await this.page
      .getByRole('grid')
      .getByRole('button')
      .filter({ hasText: new RegExp(`^${day}$`) })
      .first()
      .click()
  }

  /** @param {string} name e.g. 'Đổi trạng thái' */
  async openAction(name) {
    await this.actionsMenu.click()
    await this.page.getByRole('menuitem', { name }).click()
  }
}
