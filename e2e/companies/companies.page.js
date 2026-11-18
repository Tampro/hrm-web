// @ts-check
// Page object: locators + actions only. Assertions stay in the spec. Labels = vi.json (tests run with locale vi).

export class CompaniesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Quản lý công ty' })
    this.addButton = page.getByRole('button', { name: 'Thêm công ty' })
    this.keyword = page.getByLabel('Từ khoá')
    this.searchButton = page.getByRole('button', { name: /^Tìm kiếm/ })
    this.clearButton = page.getByRole('button', { name: 'Xoá bộ lọc' })
    this.table = page.getByRole('table')
    this.rows = page.getByRole('table').locator('tbody tr')
    this.showing = page.getByText(/^Hiển thị \d+ \/ \d+$/)
    this.toast = page.locator('[data-sonner-toast]')
    this.dialog = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.sidebarCompanies = page.getByRole('link', { name: 'Công ty' })
  }

  async goto(query = '') {
    await this.page.goto(`/dashboard/companies${query}`)
  }

  /** @param {'Tất cả' | 'Hoạt động' | 'Tạm khoá'} name */
  tab(name) {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}`) })
  }

  /** @param {string} companyName */
  row(companyName) {
    return this.rows.filter({ hasText: companyName })
  }

  /**
   * Open the row "⋯" menu and pick an action.
   * @param {string} companyName
   * @param {string} actionLabel  e.g. 'Sửa', 'Khoá đăng nhập'
   */
  async rowAction(companyName, actionLabel) {
    await this.page.getByRole('button', { name: `Thao tác cho ${companyName}` }).click()
    await this.page.getByRole('menuitem', { name: actionLabel }).click()
  }
}
