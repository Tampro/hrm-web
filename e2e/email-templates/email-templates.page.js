// @ts-check
// Page object for Email templates (list + editor). Locators + actions only; labels = vi.json.

export class EmailTemplatesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByRole('textbox', { name: 'Từ khoá' })
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' })
    this.settingsForm = page.getByRole('form', { name: 'Thiết lập' })
    this.contentForm = page.getByRole('form', { name: 'Nội dung' })
    this.fromName = this.settingsForm.getByRole('textbox', { name: 'Tên người gửi' })
    this.subject = this.contentForm.getByRole('textbox', { name: 'Tiêu đề email' })
    this.content = this.contentForm.getByRole('textbox', { name: 'Nội dung email' })
    this.previewButton = page.getByRole('button', { name: 'Xem trước' })
    this.variables = page.getByRole('complementary', { name: 'Biến có thể dùng' })
    this.dialog = page.getByRole('dialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} [id] template id; empty = list */
  async goto(id = '') {
    await this.page.goto(`/dashboard/email-templates${id ? `/${id}` : ''}`)
  }

  /** @param {string} label e.g. 'Tiếng Hàn' */
  languageTab(label) {
    return this.contentForm.getByRole('tab', { name: label })
  }

  /** @param {import('@playwright/test').Locator} form */
  saveButtonOf(form) {
    return form.getByRole('button', { name: 'Lưu thay đổi' })
  }
}
