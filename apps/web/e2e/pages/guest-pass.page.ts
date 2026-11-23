import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page Object for GuestPassModal (Radix Dialog mounted in Portal at document.body)
 * and protected Knowledge Base article rendering.
 */
export class GuestPassPage {
  readonly dialog: Locator
  readonly submitButton: Locator
  readonly articleContent: Locator

  constructor(private readonly page: Page) {
    // Radix Dialog renders inside a Portal on body, so locators must query from `page` root.
    this.dialog = page.getByTestId('guest-pass-dialog')
    this.submitButton = page.getByTestId('guest-pass-submit-btn')
    this.articleContent = page.getByTestId('kb-article-content')
  }

  async waitForDialogOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.dialog).toHaveAttribute('data-state', 'open')
  }

  async submitDefaultPass(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/auth/guest-pass') && res.request().method() === 'POST',
    )
    await expect(this.submitButton).toBeEnabled()
    await this.submitButton.click()
    const response = await responsePromise
    expect(response.status()).toBe(200)
    await expect(this.dialog).toBeHidden()
  }
}
