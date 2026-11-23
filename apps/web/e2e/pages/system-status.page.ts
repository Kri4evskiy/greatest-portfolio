import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page Object for `/system-status` observability matrix, live event log, and leaderboard pagination.
 */
export class SystemStatusPage {
  readonly capabilitiesGrid: Locator
  readonly liveEventsTable: Locator
  readonly leaderboardTable: Locator
  readonly page2Button: Locator

  constructor(private readonly page: Page) {
    this.capabilitiesGrid = page.getByTestId('capabilities-nodes-grid')
    this.liveEventsTable = page.getByTestId('live-events-table')
    this.leaderboardTable = page.getByTestId('leaderboard-table')
    this.page2Button = page.getByTestId('leaderboard-page-2-btn')
  }

  async goto(): Promise<void> {
    await this.page.goto('/system-status')
  }

  async waitForReady(): Promise<void> {
    await expect(this.capabilitiesGrid).toBeVisible()
    await expect(this.liveEventsTable).toBeVisible()
    await expect(this.leaderboardTable).toBeVisible()
  }

  async goToLeaderboardPage2(): Promise<void> {
    const page2Response = this.page.waitForResponse(
      (res) => res.url().includes('/api/knowledge/metrics/paginated') && res.url().includes('offset=5'),
    )
    await expect(this.page2Button).toBeEnabled()
    await this.page2Button.click()
    const response = await page2Response
    expect(response.status()).toBe(200)
  }
}
