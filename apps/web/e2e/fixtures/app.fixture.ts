import { test as base, expect } from '@playwright/test'
import { GuestPassPage } from '../pages/guest-pass.page'
import { SystemStatusPage } from '../pages/system-status.page'

interface AppFixtures {
  guestPassPage: GuestPassPage
  systemStatusPage: SystemStatusPage
}

export const test = base.extend<AppFixtures>({
  page: async ({ page }, use) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const serverErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`)
      }
    })

    await use(page)

    expect(consoleErrors, `Unexpected console.error messages: ${consoleErrors.join(' | ')}`).toEqual([])
    expect(pageErrors, `Unexpected uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([])
    expect(serverErrors, `Unexpected 5xx responses: ${serverErrors.join(' | ')}`).toEqual([])
  },

  guestPassPage: async ({ page }, use) => {
    await use(new GuestPassPage(page))
  },

  systemStatusPage: async ({ page }, use) => {
    await use(new SystemStatusPage(page))
  },
})

export { expect }
