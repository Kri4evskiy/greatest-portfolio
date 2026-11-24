import { describe, expect, it } from 'vitest'
import {
  ArticleReactionInputSchema,
  DEFAULT_DEV_JWT_SECRET,
  DEFAULT_LOCALE,
  GuestPassFormSchema,
  getKnowledgeCategoryLabel,
  getTechRadarItems,
  JwtSessionPayloadSchema,
  KB_COOKIE_MAX_AGE_MS,
  LOCALE_METADATA,
  PaginatedArticleMetricsQuerySchema,
  PaginatedArticleMetricsResponseSchema,
  PaginatedSystemEventsResponseSchema,
  resolveJwtSecret,
  SessionProfileSchema,
  SUPPORTED_LOCALES,
  SystemCapabilitiesSchema,
  SystemEventsQuerySchema,
  TechRadarItemSchema,
  TelemetryAdminDiagnosticsSchema,
} from '../index.js'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_ISO = '2026-11-23T09:00:00.000Z'

describe('SystemCapabilitiesSchema', () => {
  const validPayload = {
    status: 'ok' as const,
    mode: 'demo' as const,
    persistence: 'in-memory-fallback' as const,
    rateLimiter: 'in-memory' as const,
    telemetryTcpConnected: false,
    integrations: {
      redisCache: false,
      s3ObjectStorage: false,
      telegramBotAuth: false,
      sentryObservability: false,
    },
    timestamp: VALID_ISO,
  }

  it('accepts valid capability payloads across supported modes', () => {
    expect(SystemCapabilitiesSchema.parse(validPayload)).toEqual(validPayload)

    const prodPayload = {
      ...validPayload,
      mode: 'production' as const,
      persistence: 'postgresql' as const,
      rateLimiter: 'redis' as const,
      telemetryTcpConnected: true,
      integrations: {
        redisCache: true,
        s3ObjectStorage: true,
        telegramBotAuth: true,
        sentryObservability: true,
      },
    }
    expect(SystemCapabilitiesSchema.parse(prodPayload)).toEqual(prodPayload)
  })

  it('rejects non-boolean integrations, invalid status, or non-ISO timestamps', () => {
    expect(SystemCapabilitiesSchema.safeParse({ ...validPayload, status: 'degraded' }).success).toBe(false)
    expect(SystemCapabilitiesSchema.safeParse({ ...validPayload, persistence: 'sqlite' }).success).toBe(false)
    expect(SystemCapabilitiesSchema.safeParse({ ...validPayload, timestamp: '23-11-2026' }).success).toBe(false)
    expect(
      SystemCapabilitiesSchema.safeParse({
        ...validPayload,
        integrations: { ...validPayload.integrations, redisCache: 'true' },
      }).success,
    ).toBe(false)
  })
})

describe('PaginatedArticleMetricsQuerySchema & ResponseSchema', () => {
  it('applies defaults and coerces numeric query strings', () => {
    expect(PaginatedArticleMetricsQuerySchema.parse({})).toEqual({
      limit: 20,
      offset: 0,
      sortBy: 'viewsCount',
    })

    expect(
      PaginatedArticleMetricsQuerySchema.parse({
        limit: '5',
        offset: '10',
        category: 'this-project',
        sortBy: 'helpfulCount',
      }),
    ).toEqual({
      limit: 5,
      offset: 10,
      category: 'this-project',
      sortBy: 'helpfulCount',
    })
  })

  it('enforces limit/offset bounds and valid category/sortBy enums', () => {
    expect(PaginatedArticleMetricsQuerySchema.safeParse({ limit: 0 }).success).toBe(false)
    expect(PaginatedArticleMetricsQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
    expect(PaginatedArticleMetricsQuerySchema.safeParse({ offset: -1 }).success).toBe(false)
    expect(PaginatedArticleMetricsQuerySchema.safeParse({ offset: 501 }).success).toBe(false)
    expect(PaginatedArticleMetricsQuerySchema.safeParse({ category: 'unknown-topic' }).success).toBe(false)
    expect(PaginatedArticleMetricsQuerySchema.safeParse({ sortBy: 'createdAt' }).success).toBe(false)
  })

  it('validates offset paginated article response payloads', () => {
    const validResponse = {
      items: [
        {
          slug: 'adr-full-stack-catalog',
          category: 'typescript' as const,
          viewsCount: 142,
          helpfulCount: 38,
          updatedAt: VALID_ISO,
        },
      ],
      total: 10,
      limit: 5,
      offset: 5,
      hasMore: false,
      nextOffset: null,
    }
    expect(PaginatedArticleMetricsResponseSchema.parse(validResponse)).toEqual(validResponse)
  })
})

describe('SystemEventsQuerySchema & PaginatedSystemEventsResponseSchema', () => {
  it('accepts omitted cursor or valid UUID cursor and coerces limit', () => {
    expect(SystemEventsQuerySchema.parse({})).toEqual({ limit: 15 })
    expect(
      SystemEventsQuerySchema.parse({
        limit: '8',
        cursor: VALID_UUID,
        eventType: 'GUEST_PASS_ISSUED',
      }),
    ).toEqual({
      limit: 8,
      cursor: VALID_UUID,
      eventType: 'GUEST_PASS_ISSUED',
    })
  })

  it('rejects stringified null/empty cursors and out-of-range limits (regression guard for ?cursor=null)', () => {
    expect(SystemEventsQuerySchema.safeParse({ cursor: 'null' }).success).toBe(false)
    expect(SystemEventsQuerySchema.safeParse({ cursor: '' }).success).toBe(false)
    expect(SystemEventsQuerySchema.safeParse({ cursor: 'not-a-uuid' }).success).toBe(false)
    expect(SystemEventsQuerySchema.safeParse({ limit: 0 }).success).toBe(false)
    expect(SystemEventsQuerySchema.safeParse({ limit: 51 }).success).toBe(false)
    expect(SystemEventsQuerySchema.safeParse({ eventType: 'UNKNOWN_EVENT' }).success).toBe(false)
  })

  it('validates cursor paginated telemetry event responses', () => {
    const validResponse = {
      items: [
        {
          id: VALID_UUID,
          type: 'ARTICLE_VIEWED' as const,
          message: 'Viewed article',
          slug: 'adr-full-stack-catalog',
          createdAt: VALID_ISO,
        },
      ],
      limit: 8,
      hasMore: true,
      nextCursor: VALID_UUID,
    }
    expect(PaginatedSystemEventsResponseSchema.parse(validResponse)).toEqual(validResponse)
  })
})

describe('Auth, Knowledge, Locale & TechRadar contracts', () => {
  it('trims GuestPassFormSchema fields and validates SessionProfileSchema', () => {
    expect(
      GuestPassFormSchema.parse({
        displayName: '  Alex • Team Lead  ',
        visitorType: 'TEAM_LEAD',
        adminPasscode: '  secret  ',
      }),
    ).toEqual({
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      adminPasscode: 'secret',
    })

    expect(GuestPassFormSchema.safeParse({ displayName: 'A', visitorType: 'TEAM_LEAD' }).success).toBe(false)

    expect(
      SessionProfileSchema.parse({
        id: null,
        displayName: null,
        visitorType: null,
        role: 'GUEST',
        expiresAt: null,
      }).role,
    ).toBe('GUEST')
  })

  it('resolves JWT secret with dev fallback when blank', () => {
    expect(KB_COOKIE_MAX_AGE_MS).toBe(1000 * 60 * 60 * 24)
    expect(
      JwtSessionPayloadSchema.safeParse({
        sub: VALID_UUID,
        displayName: 'Alex • Team Lead',
        visitorType: 'TEAM_LEAD',
        role: 'USER',
        expiresAt: VALID_ISO,
      }).success,
    ).toBe(true)
    expect(
      TelemetryAdminDiagnosticsSchema.safeParse({
        status: 'ok',
        activeSseStreams: 1,
        maxSseStreamsGlobal: 50,
        maxSseStreamsPerIp: 2,
        trackedSessionsInMemory: 3,
        trackedMetricsInMemory: 10,
        totalEventsProcessed: 12,
        databaseConnected: false,
        uptimeSeconds: 42,
        timestamp: VALID_ISO,
      }).success,
    ).toBe(true)

    expect(resolveJwtSecret()).toBe(DEFAULT_DEV_JWT_SECRET)
    expect(resolveJwtSecret('   ')).toBe(DEFAULT_DEV_JWT_SECRET)
    expect(resolveJwtSecret('  custom-prod-secret-value  ')).toBe('custom-prod-secret-value')
  })

  it('enforces safe slug characters in ArticleReactionInputSchema', () => {
    expect(
      ArticleReactionInputSchema.safeParse({
        slug: 'this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki',
        category: 'this-project',
      }).success,
    ).toBe(true)
    expect(
      ArticleReactionInputSchema.safeParse({
        slug: '../etc/passwd',
        category: 'others',
      }).success,
    ).toBe(false)
  })

  it('maintains complete locale metadata and valid 16-ADR Tech Radar arrays across EN/UK/RU', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_METADATA[locale].code).toBe(locale)
      expect(getKnowledgeCategoryLabel('this-project', locale).length).toBeGreaterThan(0)

      const items = getTechRadarItems(locale)
      expect(items).toHaveLength(16)
      for (const item of items) {
        expect(TechRadarItemSchema.safeParse(item).success).toBe(true)
      }
      expect(items.some((item) => item.id === 'tanstack-table-compiler')).toBe(true)
    }
  })
})
