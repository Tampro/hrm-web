// @ts-check
// Page objects for the Plans section. Locators + actions only; labels = vi.json.

export class PlansPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Gói dịch vụ', level: 1 })
    this.addButton = page.getByRole('button', { name: 'Thêm gói' })
    this.sheet = page.getByRole('dialog')
    this.alertDialog = page.getByRole('alertdialog')
    this.toast = page.locator('[data-sonner-toast]')
    this.sectionTab = (/** @type {string} */ name) => page.getByRole('tab', { name, exact: true })
  }

  /** @param {string} [path] '' | '/requests' | '/orders' */
  async goto(path = '', query = '') {
    await this.page.goto(`/dashboard/plans${path}${query}`)
  }

  /** @param {string} name */
  card(name) {
    return this.page.getByRole('article', { name })
  }

  /** @param {'Theo tháng' | 'Theo năm'} name */
  cycleTab(name) {
    return this.page.getByRole('tab', { name })
  }

  /** @param {string} label */
  field(label) {
    return this.sheet.getByRole('textbox', { name: label, exact: true })
  }

  /** @param {string} label */
  switchOf(label) {
    return this.sheet.getByRole('switch', { name: label })
  }
}

export class SaasListPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.keyword = page.getByLabel('Từ khoá')
    this.searchButton = page.getByRole('button', { name: /^Tìm kiếm/ })
    this.clearButton = page.getByRole('button', { name: 'Xoá bộ lọc' })
    this.table = page.getByRole('table')
    this.rows = page.getByRole('table').locator('tbody tr')
    this.showing = page.getByText(/^Hiển thị \d+ \/ \d+$/)
    this.dialog = page.getByRole('dialog')
    this.toast = page.locator('[data-sonner-toast]')
  }

  /** @param {string} name e.g. 'Chờ duyệt' */
  statusTab(name) {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}`) })
  }

  /** @param {string} text */
  row(text) {
    return this.rows.filter({ hasText: text })
  }
}
