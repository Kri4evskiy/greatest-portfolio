import { KB_ACCESS_COOKIE_NAME } from '@repo/shared-schemas'
import { expect, test } from '../fixtures/app.fixture'

const PROTECTED_ARTICLE_PATH = '/knowledge-base/this-project/knowledge-engine/server-mdx-ast-dual-theme-shiki'

test.describe('Starter Full-Stack E2E: RBAC Guest Pass + System Observability', () => {
  test.describe.configure({ mode: 'serial' })

  test('redirects unauthenticated guest to GuestPassModal, issues HttpOnly cookie, unlocks MDX article, and paginates /system-status', async ({
    page,
    context,
    guestPassPage,
    systemStatusPage,
  }) => {
    await test.step('1. Redirect unauthenticated guest to GuestPassModal via Edge Proxy', async () => {
      await page.goto(PROTECTED_ARTICLE_PATH)
      await expect(page).toHaveURL(/\?unlock=knowledge-base/)
      await guestPassPage.waitForDialogOpen()
    })

    await test.step('2. Issue Guest Pass and verify HttpOnly JWT cookie', async () => {
      await guestPassPage.submitDefaultPass()

      const cookies = await context.cookies()
      const authCookie = cookies.find((cookie) => cookie.name === KB_ACCESS_COOKIE_NAME)
      expect(authCookie).toBeDefined()
      expect(authCookie?.httpOnly).toBe(true)
    })

    await test.step('3. Land on protected MDX article and verify server-compiled content', async () => {
      await expect(page).toHaveURL(new RegExp(`${PROTECTED_ARTICLE_PATH}$`))
      await expect(guestPassPage.articleContent).toBeVisible()
      await expect(guestPassPage.articleContent).toContainText('Server MDX Engine')
    })

    await test.step('4. Verify /system-status Capability Matrix, Cursor Event Log, and Leaderboard Page 1 -> Page 2', async () => {
      await systemStatusPage.goto()
      await systemStatusPage.waitForReady()

      await expect(systemStatusPage.leaderboardTable).toContainText(
        'this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki',
      )
      await systemStatusPage.goToLeaderboardPage2()
      await expect(systemStatusPage.leaderboardTable).toContainText('strict-typescript-zod-contracts')
    })
  })
})
