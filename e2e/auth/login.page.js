// @ts-check
// Page object: locators + actions only. Assertions stay in the spec.
// Labels are the vi.json texts (tests run with locale vi).

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.heading = page.getByText('Đăng nhập', { exact: true }).first()
    this.username = page.getByLabel('Tên đăng nhập')
    this.password = page.getByLabel('Mật khẩu', { exact: true })
    this.togglePassword = page.getByRole('button', { name: /Hiện mật khẩu|Ẩn mật khẩu/ })
    this.submit = page.getByRole('button', { name: 'Đăng nhập', exact: true })
    this.toast = page.locator('[data-sonner-toast]')
  }

  async goto() {
    await this.page.goto('/auth/login')
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.username.fill(username)
    await this.password.fill(password)
    await this.submit.click()
  }
}
