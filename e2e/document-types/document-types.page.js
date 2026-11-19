// @ts-check
// Page object for Document types (form on the left, list on the right). Locators + actions only; labels = vi.json.

export class DocumentTypesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.required = page.getByRole('combobox', { name: 'Bắt buộc', exact: true })
    this.addForm = page.getByRole('form', { name: 'Thêm loại tài liệu' })
    this.editForm = page.getByRole('form', { name: 'Sửa loại tài liệu' })
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [query] e.g. '?companyId=2' */
  async goto(query = '') {
    await this.page.goto(`/dashboard/document-types${query}`)
  }

  /** @param {string} name */
  row(name) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  /** @param {string} option e.g. 'Không bắt buộc' */
  async filterRequired(option) {
    await this.required.click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }
}
