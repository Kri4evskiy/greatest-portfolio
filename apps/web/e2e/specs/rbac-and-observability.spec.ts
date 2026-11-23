import { KB_ACCESS_COOKIE_NAME } from '@repo/shared-schemas'
import { expect, test } from '../fixtures/app.fixture'

const PROTECTED_ARTICLE_PATH = '/knowledge-base/this-project/knowledge-engine/server-mdx-ast-dual-theme-shiki'

test.describe('Starter Full-Stack E2E: RBAC Guest Pass + System Observability', () => {
  test('redirects unauthenticated guest to GuestPassModal, issues HttpOnly cookie, unlocks MDX article, and paginates /system-status', async ({
    page,
    context,
    guestPassPage,
    systemStatusPage,
  }) => {
    // 1. Visiting protected KB route as GUEST triggers Edge Proxy redirect to ?unlock=knowledge-base
    await page.goto(PROTECTED_ARTICLE_PATH)
    await expect(page).toHaveURL(/\?unlock=knowledge-base/)

    // 2. Radix Dialog opens via Portal; submitting default Guest Pass issues HttpOnly cookie
    await guestPassPage.waitForDialogOpen()
    await guestPassPage.submitDefaultPass()

    const cookies = await context.cookies()
    const authCookie = cookies.find((cookie) => cookie.name === KB_ACCESS_COOKIE_NAME)
    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)

    // 3. Redirect lands on protected MDX article and renders server-compiled content
    await expect(page).toHaveURL(new RegExp(`${PROTECTED_ARTICLE_PATH}$`))
    await expect(guestPassPage.articleContent).toBeVisible()
    await expect(guestPassPage.articleContent).toContainText('Server MDX Engine')

    // 4. /system-status renders Capability Matrix, Cursor Event Log, and 2-page Leaderboard from seed
    await systemStatusPage.goto()
    await systemStatusPage.waitForReady()

    await expect(systemStatusPage.leaderboardTable).toContainText(
      'this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki',
    )
    await systemStatusPage.goToLeaderboardPage2()
    await expect(systemStatusPage.leaderboardTable).toContainText('strict-typescript-zod-contracts')
  })
})
