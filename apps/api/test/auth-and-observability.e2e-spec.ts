import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  ArticleMetaSchema,
  KB_ACCESS_COOKIE_NAME,
  PaginatedArticleMetricsResponseSchema,
  PaginatedSystemEventsResponseSchema,
  SessionProfileSchema,
  SystemCapabilitiesSchema,
  TelemetryAdminDiagnosticsSchema,
} from '@repo/shared-schemas'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

describe('Backend HTTP E2E (AppModule + Pipes + Guards + CSRF + HttpOnly Cookies + In-Memory Fallback)', () => {
  let app: INestApplication

  beforeAll(async () => {
    // Ensure isolated deterministic in-memory mode even if developer has local DB env vars
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv('DIRECT_URL', '')
    vi.stubEnv('WORKFOLIO_DEMO_MODE', 'true')

    const [{ AppModule }, { SentryExceptionFilter }, { LoggingInterceptor }] = await Promise.all([
      import('../src/app.module.js'),
      import('../src/common/filters/sentry-exception.filter.js'),
      import('../src/common/interceptors/logging.interceptor.js'),
    ])

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.use(cookieParser())
    app.useGlobalFilters(new SentryExceptionFilter())
    app.useGlobalInterceptors(new LoggingInterceptor())
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
    vi.unstubAllEnvs()
  })

  it('serves capabilities, enforces CSRF & RBAC, issues HttpOnly Guest Pass, validates slug allowlist/dedup, and gates ADMIN diagnostics', async () => {
    const httpServer = app.getHttpServer()

    // 1. Capabilities endpoint conforms to SystemCapabilitiesSchema
    const capabilitiesRes = await request(httpServer).get('/api/capabilities').expect(200)
    const capabilities = SystemCapabilitiesSchema.parse(capabilitiesRes.body)
    expect(capabilities.persistence).toBe('in-memory-fallback')

    // 2. Public read-only metrics are accessible; write mutations & admin diagnostics return 403 for GUEST
    const publicMetricsRes = await request(httpServer).get('/api/knowledge/metrics').expect(200)
    expect(Array.isArray(publicMetricsRes.body)).toBe(true)
    expect(publicMetricsRes.body).toHaveLength(10)

    await request(httpServer)
      .post('/api/knowledge/adr-full-stack-catalog/view')
      .send({ category: 'typescript' })
      .expect(403)
    await request(httpServer).get('/api/telemetry/admin-diagnostics').expect(403)

    // 3. CSRF guards reject urlencoded cross-site forms (415) and disallowed Origins (403)
    await request(httpServer)
      .post('/api/auth/guest-pass')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('displayName=Evil&visitorType=OTHER')
      .expect(415)

    await request(httpServer)
      .post('/api/auth/logout')
      .set('Origin', 'https://evil-attacker.example')
      .set('Sec-Fetch-Site', 'cross-site')
      .expect(403)

    // 4. Invalid non-empty adminPasscode fails closed with 403 (no silent downgrade)
    await request(httpServer)
      .post('/api/auth/guest-pass')
      .send({ displayName: 'Alex • Team Lead', visitorType: 'TEAM_LEAD', adminPasscode: 'wrong-passcode' })
      .expect(403)

    // 5. Issuing USER Guest Pass sets HttpOnly cookie & X-Request-Id correlation header
    const passRes = await request(httpServer)
      .post('/api/auth/guest-pass')
      .send({ displayName: 'Alex • Team Lead', visitorType: 'TEAM_LEAD' })
      .expect(200)

    const profile = SessionProfileSchema.parse(passRes.body)
    expect(profile.role).toBe('USER')
    expect(passRes.headers['x-request-id']).toBeTruthy()

    const setCookieHeader = passRes.headers['set-cookie']
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : []
    const authCookie = cookies.find((c) => c.startsWith(`${KB_ACCESS_COOKIE_NAME}=`))
    expect(authCookie).toBeDefined()
    expect(authCookie).toContain('HttpOnly')
    expect(authCookie).toContain('SameSite=Lax')

    // 6. Authenticated USER can read /auth/me & mutate known slugs, gets 404 on unknown slugs & 403 on ADMIN diagnostics
    const cookiePair = authCookie ? authCookie.split(';')[0] : ''
    const meRes = await request(httpServer).get('/api/auth/me').set('Cookie', cookiePair).expect(200)
    expect(SessionProfileSchema.parse(meRes.body).role).toBe('USER')

    await request(httpServer)
      .post('/api/knowledge/non-existent-junk-slug/view')
      .set('Cookie', cookiePair)
      .send({ category: 'typescript' })
      .expect(404)

    const helpfulFirstRes = await request(httpServer)
      .post('/api/knowledge/adr-full-stack-catalog/helpful')
      .set('Cookie', cookiePair)
      .send({ category: 'typescript' })
      .expect(200)
    const helpfulFirst = ArticleMetaSchema.parse(helpfulFirstRes.body)

    // Second helpful vote in same session is deduplicated
    const helpfulSecondRes = await request(httpServer)
      .post('/api/knowledge/adr-full-stack-catalog/helpful')
      .set('Cookie', cookiePair)
      .send({ category: 'typescript' })
      .expect(200)
    expect(ArticleMetaSchema.parse(helpfulSecondRes.body).helpfulCount).toBe(helpfulFirst.helpfulCount)

    await request(httpServer).get('/api/telemetry/admin-diagnostics').set('Cookie', cookiePair).expect(403)

    // 7. ADMIN session accesses /api/telemetry/admin-diagnostics cleanly
    const adminPassRes = await request(httpServer)
      .post('/api/auth/guest-pass')
      .send({
        displayName: 'Stanislav • Owner',
        visitorType: 'FOUNDER',
        adminPasscode: 'workfolio-admin-2026',
      })
      .expect(200)
    expect(SessionProfileSchema.parse(adminPassRes.body).role).toBe('ADMIN')

    const adminCookies = Array.isArray(adminPassRes.headers['set-cookie'])
      ? adminPassRes.headers['set-cookie']
      : adminPassRes.headers['set-cookie']
        ? [adminPassRes.headers['set-cookie']]
        : []
    const adminCookiePair = adminCookies.find((c) => c.startsWith(`${KB_ACCESS_COOKIE_NAME}=`))?.split(';')[0] ?? ''

    const diagnosticsRes = await request(httpServer)
      .get('/api/telemetry/admin-diagnostics')
      .set('Cookie', adminCookiePair)
      .expect(200)
    expect(TelemetryAdminDiagnosticsSchema.parse(diagnosticsRes.body).maxSseStreamsPerIp).toBe(2)

    // 8. Public offset-paginated leaderboard returns Page 2 cleanly & rejects offset > 500
    const page2Res = await request(httpServer).get('/api/knowledge/metrics/paginated?limit=5&offset=5').expect(200)
    const page2 = PaginatedArticleMetricsResponseSchema.parse(page2Res.body)
    expect(page2.items).toHaveLength(5)
    expect(page2.total).toBe(10)
    expect(page2.hasMore).toBe(false)
    expect(page2.nextOffset).toBeNull()

    await request(httpServer).get('/api/knowledge/metrics/paginated?limit=5&offset=501').expect(400)

    // 9. ZodValidationPipe rejects ?cursor=null with 400 + requestId, while valid query includes GUEST_PASS_ISSUED event
    const invalidCursorRes = await request(httpServer).get('/api/telemetry/events?cursor=null').expect(400)
    expect(invalidCursorRes.body).toMatchObject({
      statusCode: 400,
      message: 'Validation failed',
    })
    expect(invalidCursorRes.body.requestId).toBeTruthy()

    const eventsRes = await request(httpServer).get('/api/telemetry/events?limit=5').expect(200)
    const eventsPage = PaginatedSystemEventsResponseSchema.parse(eventsRes.body)
    expect(eventsPage.items.some((ev) => ev.type === 'GUEST_PASS_ISSUED')).toBe(true)
  })
})
