// @ts-check
// Page object for Award types (form on the left, list on the right). Locators + actions only; labels = vi.json.

export class AwardTypesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.status = page.getByRole('combobox', { name: 'Trạng thái', exact: true })
    this.addForm = page.getByRole('form', { name: 'Thêm loại khen thưởng' })
    this.editForm = page.getByRole('form', { name: 'Sửa loại khen thưởng' })
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [query] e.g. '?companyId=2' */
  async goto(query = '') {
    await this.page.goto(`/dashboard/award-types${query}`)
  }

  /** @param {string} name */
  row(name) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  /** @param {string} option e.g. 'Tạm nghỉ' */
  async filterStatus(option) {
    await this.status.click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }
}
