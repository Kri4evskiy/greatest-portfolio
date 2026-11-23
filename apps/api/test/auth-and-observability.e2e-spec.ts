import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  KB_ACCESS_COOKIE_NAME,
  PaginatedArticleMetricsResponseSchema,
  PaginatedSystemEventsResponseSchema,
  SessionProfileSchema,
  SystemCapabilitiesSchema,
} from '@repo/shared-schemas'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

describe('Backend HTTP E2E (AppModule + Pipes + Guards + HttpOnly Cookies + In-Memory Fallback)', () => {
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

  it('serves capabilities, issues HttpOnly Guest Pass, gates protected metrics, and validates pagination/cursor queries', async () => {
    const httpServer = app.getHttpServer()

    // 1. Capabilities endpoint conforms to SystemCapabilitiesSchema
    const capabilitiesRes = await request(httpServer).get('/api/capabilities').expect(200)
    const capabilities = SystemCapabilitiesSchema.parse(capabilitiesRes.body)
    expect(capabilities.persistence).toBe('in-memory-fallback')

    // 2. Unauthenticated protected route returns 403 Forbidden
    await request(httpServer).get('/api/knowledge/metrics').expect(403)

    // 3. Issuing Guest Pass sets HttpOnly cookie & X-Request-Id correlation header
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

    // 4. Authenticated /api/auth/me and /api/knowledge/metrics succeed with the cookie
    const cookiePair = authCookie ? authCookie.split(';')[0] : ''
    const meRes = await request(httpServer).get('/api/auth/me').set('Cookie', cookiePair).expect(200)
    expect(SessionProfileSchema.parse(meRes.body).role).toBe('USER')

    const allMetricsRes = await request(httpServer).get('/api/knowledge/metrics').set('Cookie', cookiePair).expect(200)
    expect(Array.isArray(allMetricsRes.body)).toBe(true)
    expect(allMetricsRes.body).toHaveLength(10)

    // 5. Public offset-paginated leaderboard returns Page 2 cleanly from 10 seeded articles
    const page2Res = await request(httpServer).get('/api/knowledge/metrics/paginated?limit=5&offset=5').expect(200)
    const page2 = PaginatedArticleMetricsResponseSchema.parse(page2Res.body)
    expect(page2.items).toHaveLength(5)
    expect(page2.total).toBe(10)
    expect(page2.hasMore).toBe(false)
    expect(page2.nextOffset).toBeNull()

    // 6. ZodValidationPipe rejects ?cursor=null with 400 + requestId, while valid query includes GUEST_PASS_ISSUED event
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
