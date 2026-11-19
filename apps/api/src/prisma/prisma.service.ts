import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import type { ArticleMeta, KnowledgeCategory, Role, VisitorRoleType } from '@repo/shared-schemas'
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

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private client: PrismaClient | null = null
  private pool: Pool | null = null
  private dbConnected = false

  private readonly memorySessions = new Map<string, StoredVisitorSession>()
  private readonly memoryMetrics = new Map<string, ArticleMeta>()

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
          visitorType: created.visitorType as VisitorRoleType,
          role: created.role as Role,
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
    this.memorySessions.set(session.id, session)
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
            category: r.category as KnowledgeCategory,
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
          category: updated.category as KnowledgeCategory,
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
      viewsCount: (existing?.viewsCount ?? 100) + 1,
      helpfulCount: existing?.helpfulCount ?? 25,
      updatedAt: new Date().toISOString(),
    }
    this.memoryMetrics.set(slug, next)
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
          category: updated.category as KnowledgeCategory,
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
      viewsCount: existing?.viewsCount ?? 100,
      helpfulCount: (existing?.helpfulCount ?? 25) + 1,
      updatedAt: new Date().toISOString(),
    }
    this.memoryMetrics.set(slug, next)
    return next
  }

  async logSystemEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.dbConnected || !this.client) {
      return
    }
    try {
      const jsonPayload = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
      await this.client.systemEventLog.create({
        data: {
          eventType,
          payload: jsonPayload,
        },
      })
    } catch (err) {
      this.logger.warn(`Prisma logSystemEvent fallback: ${String(err)}`)
    }
  }
}
