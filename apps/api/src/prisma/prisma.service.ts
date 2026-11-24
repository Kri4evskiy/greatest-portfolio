import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  type ArticleMeta,
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type PaginatedArticleMetricsQuery,
  type PaginatedArticleMetricsResponse,
  type PaginatedSystemEventsResponse,
  type Role,
  RoleEnum,
  type SystemEventLogItem,
  type SystemEventsQuery,
  TelemetryEventTypeEnum,
  type VisitorRoleType,
  VisitorRoleTypeEnum,
} from '@repo/shared-schemas'
import { Pool } from 'pg'
import { databaseConfig, extractPostgresSchema } from '../config/database.config.js'
import { type Prisma, PrismaClient } from '../generated/prisma/client.js'
import { INITIAL_ARTICLE_SEEDS } from '../migrations/scripts/seed-data.js'

export interface StoredVisitorSession {
  id: string
  displayName: string
  visitorType: VisitorRoleType
  role: Role
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_MEMORY_SYSTEM_EVENTS = 200
export const MAX_MEMORY_SESSIONS = 200
export const MAX_MEMORY_METRICS = 200

const SEEDED_METRIC_SLUGS = new Set(INITIAL_ARTICLE_SEEDS.map((item) => item.slug))

function parseKnowledgeCategory(raw: unknown, fallback: KnowledgeCategory = 'others'): KnowledgeCategory {
  const parsed = KnowledgeCategoryEnum.safeParse(raw)
  return parsed.success ? parsed.data : fallback
}

function parseRole(raw: unknown, fallback: Role = 'USER'): Role {
  const parsed = RoleEnum.safeParse(raw)
  return parsed.success ? parsed.data : fallback
}

function parseVisitorRole(raw: unknown, fallback: VisitorRoleType = 'OTHER'): VisitorRoleType {
  const parsed = VisitorRoleTypeEnum.safeParse(raw)
  return parsed.success ? parsed.data : fallback
}

function buildOffsetMetricsPage(
  items: ArticleMeta[],
  total: number,
  query: Pick<PaginatedArticleMetricsQuery, 'limit' | 'offset'>,
): PaginatedArticleMetricsResponse {
  const consumed = query.offset + items.length
  const hasMore = consumed < total
  return {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
    hasMore,
    nextOffset: hasMore ? consumed : null,
  }
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private client: PrismaClient | null = null
  private pool: Pool | null = null
  private dbConnected = false

  private readonly memorySessions = new Map<string, StoredVisitorSession>()
  private readonly memoryMetrics = new Map<string, ArticleMeta>()
  private readonly memoryEvents: SystemEventLogItem[] = []

  constructor() {
    const now = new Date().toISOString()
    for (const item of INITIAL_ARTICLE_SEEDS) {
      this.memoryMetrics.set(item.slug, {
        slug: item.slug,
        category: item.category,
        viewsCount: item.viewsCount,
        helpfulCount: item.helpfulCount,
        updatedAt: now,
      })
    }
  }

  async onModuleInit(): Promise<void> {
    if (!databaseConfig.isConfigured || !databaseConfig.databaseUrl) {
      this.logger.warn('DATABASE_URL not set — using resilient in-memory store with Prisma schema contract')
      return
    }

    try {
      const pool = new Pool({ connectionString: databaseConfig.databaseUrl })
      pool.on('error', (error) => {
        this.logger.warn(`PostgreSQL pool error: ${error.message}`)
      })

      const schema = extractPostgresSchema(databaseConfig.databaseUrl)
      const adapter = schema ? new PrismaPg(pool, { schema }) : new PrismaPg(pool)
      const client = new PrismaClient({
        adapter,
        log: ['error', 'warn'],
      })

      this.pool = pool
      this.client = client

      await client.$connect()
      await client.$queryRaw`SELECT 1`
      this.dbConnected = true
      this.logger.log('Connected to PostgreSQL via Prisma 7 ORM (pg adapter)')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.warn(`PostgreSQL connection unavailable (${message}) — falling back to resilient in-memory store`)
      await this.disconnectClient()
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnectClient()
  }

  private async disconnectClient(): Promise<void> {
    this.dbConnected = false
    const client = this.client
    const pool = this.pool
    this.client = null
    this.pool = null

    if (client) {
      try {
        await client.$disconnect()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.logger.warn(`Prisma disconnect warning: ${message}`)
      }
    }

    if (pool) {
      try {
        await pool.end()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.logger.warn(`PostgreSQL pool shutdown warning: ${message}`)
      }
    }
  }

  isDatabaseConnected(): boolean {
    return this.dbConnected
  }

  getMemoryStoreStats(): { sessions: number; metrics: number; events: number } {
    this.pruneExpiredMemorySessions()
    return {
      sessions: this.memorySessions.size,
      metrics: this.memoryMetrics.size,
      events: this.memoryEvents.length,
    }
  }

  private pruneExpiredMemorySessions(): void {
    const nowMs = Date.now()
    for (const [id, session] of this.memorySessions) {
      if (session.expiresAt.getTime() <= nowMs) {
        this.memorySessions.delete(id)
      }
    }
  }

  private storeMemorySession(session: StoredVisitorSession): void {
    this.pruneExpiredMemorySessions()
    while (this.memorySessions.size >= MAX_MEMORY_SESSIONS) {
      const oldestKey = this.memorySessions.keys().next().value
      if (!oldestKey) {
        break
      }
      this.memorySessions.delete(oldestKey)
    }
    this.memorySessions.set(session.id, session)
  }

  private storeMemoryMetric(slug: string, metric: ArticleMeta): void {
    if (!this.memoryMetrics.has(slug) && this.memoryMetrics.size >= MAX_MEMORY_METRICS) {
      for (const existingSlug of this.memoryMetrics.keys()) {
        if (!SEEDED_METRIC_SLUGS.has(existingSlug)) {
          this.memoryMetrics.delete(existingSlug)
          break
        }
      }
    }
    this.memoryMetrics.set(slug, metric)
  }

  async createVisitorSession(data: {
    displayName: string
    visitorType: VisitorRoleType
    role: Role
    userAgent?: string | undefined
    expiresAt: Date
  }): Promise<StoredVisitorSession> {
    if (this.dbConnected && this.client) {
      try {
        const created = await this.client.visitorSession.create({
          data: {
            displayName: data.displayName,
            visitorType: data.visitorType,
            role: data.role,
            userAgent: data.userAgent ?? null,
            expiresAt: data.expiresAt,
          },
        })
        return {
          id: created.id,
          displayName: created.displayName,
          visitorType: parseVisitorRole(created.visitorType, data.visitorType),
          role: parseRole(created.role, data.role),
          userAgent: created.userAgent,
          createdAt: created.createdAt,
          expiresAt: created.expiresAt,
        }
      } catch (err) {
        this.logger.warn(`Prisma createVisitorSession fallback: ${String(err)}`)
      }
    }

    const session: StoredVisitorSession = {
      id: randomUUID(),
      displayName: data.displayName,
      visitorType: data.visitorType,
      role: data.role,
      userAgent: data.userAgent ?? null,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
    }
    this.storeMemorySession(session)
    return session
  }

  async getAllArticleMetrics(): Promise<ArticleMeta[]> {
    if (this.dbConnected && this.client) {
      try {
        const rows = await this.client.articleMetrics.findMany({
          orderBy: { slug: 'asc' },
        })
        if (rows.length > 0) {
          return rows.map((r) => ({
            slug: r.slug,
            category: parseKnowledgeCategory(r.category),
            viewsCount: r.viewsCount,
            helpfulCount: r.helpfulCount,
            updatedAt: r.updatedAt.toISOString(),
          }))
        }
      } catch (err) {
        this.logger.warn(`Prisma getAllArticleMetrics fallback: ${String(err)}`)
      }
    }

    return Array.from(this.memoryMetrics.values())
  }

  async getArticleMetricBySlug(slug: string, fallbackCategory: KnowledgeCategory): Promise<ArticleMeta> {
    if (this.dbConnected && this.client) {
      try {
        const row = await this.client.articleMetrics.findUnique({ where: { slug } })
        if (row) {
          return {
            slug: row.slug,
            category: parseKnowledgeCategory(row.category, fallbackCategory),
            viewsCount: row.viewsCount,
            helpfulCount: row.helpfulCount,
            updatedAt: row.updatedAt.toISOString(),
          }
        }
      } catch (err) {
        this.logger.warn(`Prisma getArticleMetricBySlug fallback: ${String(err)}`)
      }
    }

    const existing = this.memoryMetrics.get(slug)
    return (
      existing ?? {
        slug,
        category: fallbackCategory,
        viewsCount: 0,
        helpfulCount: 0,
        updatedAt: new Date().toISOString(),
      }
    )
  }

  async getPaginatedArticleMetrics(query: PaginatedArticleMetricsQuery): Promise<PaginatedArticleMetricsResponse> {
    const sortBy = query.sortBy ?? 'viewsCount'

    if (this.dbConnected && this.client) {
      try {
        const where = query.category ? { category: query.category } : {}
        const orderBy =
          sortBy === 'helpfulCount'
            ? [{ helpfulCount: 'desc' as const }, { viewsCount: 'desc' as const }, { slug: 'asc' as const }]
            : [{ viewsCount: 'desc' as const }, { helpfulCount: 'desc' as const }, { slug: 'asc' as const }]

        const [rows, total, allRowsCount] = await Promise.all([
          this.client.articleMetrics.findMany({
            where,
            orderBy,
            take: query.limit,
            skip: query.offset,
          }),
          this.client.articleMetrics.count({ where }),
          query.category ? this.client.articleMetrics.count() : Promise.resolve(1),
        ])
        if (total > 0 || (query.category && allRowsCount > 0)) {
          const items: ArticleMeta[] = rows.map((r) => ({
            slug: r.slug,
            category: parseKnowledgeCategory(r.category),
            viewsCount: r.viewsCount,
            helpfulCount: r.helpfulCount,
            updatedAt: r.updatedAt.toISOString(),
          }))
          return buildOffsetMetricsPage(items, total, query)
        }
      } catch (err) {
        this.logger.warn(`Prisma getPaginatedArticleMetrics fallback: ${String(err)}`)
      }
    }

    const filtered = query.category
      ? Array.from(this.memoryMetrics.values()).filter((item) => item.category === query.category)
      : Array.from(this.memoryMetrics.values())

    const sorted = filtered.sort((a, b) => {
      const primaryDiff = sortBy === 'helpfulCount' ? b.helpfulCount - a.helpfulCount : b.viewsCount - a.viewsCount
      if (primaryDiff !== 0) {
        return primaryDiff
      }
      return a.slug.localeCompare(b.slug)
    })
    const items = sorted.slice(query.offset, query.offset + query.limit)
    return buildOffsetMetricsPage(items, sorted.length, query)
  }

  async incrementArticleView(slug: string, category: KnowledgeCategory): Promise<ArticleMeta> {
    if (this.dbConnected && this.client) {
      try {
        const updated = await this.client.articleMetrics.upsert({
          where: { slug },
          update: {
            viewsCount: { increment: 1 },
          },
          create: {
            slug,
            category,
            viewsCount: 1,
            helpfulCount: 0,
          },
        })
        return {
          slug: updated.slug,
          category: parseKnowledgeCategory(updated.category, category),
          viewsCount: updated.viewsCount,
          helpfulCount: updated.helpfulCount,
          updatedAt: updated.updatedAt.toISOString(),
        }
      } catch (err) {
        this.logger.warn(`Prisma incrementArticleView fallback: ${String(err)}`)
      }
    }

    const existing = this.memoryMetrics.get(slug)
    const next: ArticleMeta = {
      slug,
      category: existing?.category ?? category,
      viewsCount: (existing?.viewsCount ?? 0) + 1,
      helpfulCount: existing?.helpfulCount ?? 0,
      updatedAt: new Date().toISOString(),
    }
    this.storeMemoryMetric(slug, next)
    return next
  }

  async incrementArticleHelpful(slug: string, category: KnowledgeCategory): Promise<ArticleMeta> {
    if (this.dbConnected && this.client) {
      try {
        const updated = await this.client.articleMetrics.upsert({
          where: { slug },
          update: {
            helpfulCount: { increment: 1 },
          },
          create: {
            slug,
            category,
            viewsCount: 1,
            helpfulCount: 1,
          },
        })
        return {
          slug: updated.slug,
          category: parseKnowledgeCategory(updated.category, category),
          viewsCount: updated.viewsCount,
          helpfulCount: updated.helpfulCount,
          updatedAt: updated.updatedAt.toISOString(),
        }
      } catch (err) {
        this.logger.warn(`Prisma incrementArticleHelpful fallback: ${String(err)}`)
      }
    }

    const existing = this.memoryMetrics.get(slug)
    const next: ArticleMeta = {
      slug,
      category: existing?.category ?? category,
      viewsCount: existing?.viewsCount ?? 1,
      helpfulCount: (existing?.helpfulCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    }
    this.storeMemoryMetric(slug, next)
    return next
  }

  private toPublicSystemEventItem(
    id: string,
    eventType: string,
    payload: unknown,
    createdAt: Date,
  ): SystemEventLogItem | null {
    const parsedType = TelemetryEventTypeEnum.safeParse(eventType)
    if (!parsedType.success) {
      return null
    }

    const record =
      typeof payload === 'object' && payload !== null && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null

    const message =
      typeof record?.message === 'string' && record.message.trim().length > 0 ? record.message : parsedType.data
    const parsedRole = VisitorRoleTypeEnum.safeParse(record?.actorRole)
    const actorRole = parsedRole.success ? parsedRole.data : undefined
    const slug = typeof record?.slug === 'string' && record.slug.trim().length > 0 ? record.slug : undefined

    return {
      id,
      type: parsedType.data,
      message,
      ...(actorRole ? { actorRole } : {}),
      ...(slug ? { slug } : {}),
      createdAt: createdAt.toISOString(),
    }
  }

  async logSystemEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const now = new Date()
    const eventId = typeof payload.id === 'string' && UUID_REGEX.test(payload.id) ? payload.id : randomUUID()
    const inMemoryItem = this.toPublicSystemEventItem(eventId, eventType, payload, now)
    if (inMemoryItem) {
      this.memoryEvents.unshift(inMemoryItem)
      if (this.memoryEvents.length > MAX_MEMORY_SYSTEM_EVENTS) {
        this.memoryEvents.pop()
      }
    }

    if (!this.dbConnected || !this.client) {
      return
    }
    try {
      const jsonPayload = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
      // Persist the exact UUID broadcast over SSE so client-side `seenIds` deduplication
      // prevents duplicate rows when merging live SSE events with GET /api/telemetry/events.
      await this.client.systemEventLog.create({
        data: {
          id: eventId,
          eventType,
          payload: jsonPayload,
        },
      })
    } catch (err) {
      this.logger.warn(`Prisma logSystemEvent fallback: ${String(err)}`)
    }
  }

  async getCursorPaginatedSystemEvents(query: SystemEventsQuery): Promise<PaginatedSystemEventsResponse> {
    if (this.dbConnected && this.client) {
      try {
        const rows = await this.client.systemEventLog.findMany({
          ...(query.eventType ? { where: { eventType: query.eventType } } : {}),
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: query.limit + 1,
          ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        })
        const hasMore = rows.length > query.limit
        const pageRows = hasMore ? rows.slice(0, query.limit) : rows
        const items = pageRows
          .map((row) => this.toPublicSystemEventItem(row.id, row.eventType, row.payload, row.createdAt))
          .filter((item): item is SystemEventLogItem => item !== null)
        const lastRow = pageRows.at(-1)
        return {
          items,
          limit: query.limit,
          hasMore,
          nextCursor: hasMore && lastRow ? lastRow.id : null,
        }
      } catch (err) {
        this.logger.warn(`Prisma getCursorPaginatedSystemEvents fallback: ${String(err)}`)
      }
    }

    const filteredEvents = query.eventType
      ? this.memoryEvents.filter((item) => item.type === query.eventType)
      : this.memoryEvents

    let startIndex = 0
    if (query.cursor) {
      const cursorIndex = filteredEvents.findIndex((item) => item.id === query.cursor)
      if (cursorIndex === -1) {
        return {
          items: [],
          limit: query.limit,
          hasMore: false,
          nextCursor: null,
        }
      }
      startIndex = cursorIndex + 1
    }

    const sliced = filteredEvents.slice(startIndex, startIndex + query.limit + 1)
    const hasMore = sliced.length > query.limit
    const items = hasMore ? sliced.slice(0, query.limit) : sliced
    return {
      items,
      limit: query.limit,
      hasMore,
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    }
  }
}
