import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import type { ArticleMeta, KnowledgeCategory, Role, VisitorRoleType } from '@repo/shared-schemas'

export interface StoredVisitorSession {
  id: string
  displayName: string
  visitorType: VisitorRoleType
  role: Role
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
}

const INITIAL_ARTICLES: Array<{
  slug: string
  category: KnowledgeCategory
  viewsCount: number
  helpfulCount: number
}> = [
  {
    slug: 'adr-full-stack-catalog',
    category: 'typescript',
    viewsCount: 142,
    helpfulCount: 38,
  },
  {
    slug: 'react-18-vs-19-compiler-d3',
    category: 'react',
    viewsCount: 198,
    helpfulCount: 64,
  },
  {
    slug: 'nestjs-jwt-httponly-prisma-sse',
    category: 'nestjs-prisma',
    viewsCount: 167,
    helpfulCount: 51,
  },
  {
    slug: 'tanstack-redact-bundle-docker',
    category: 'architecture-devops',
    viewsCount: 129,
    helpfulCount: 44,
  },
]

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private dbConnected = false

  private readonly memorySessions = new Map<string, StoredVisitorSession>()
  private readonly memoryMetrics = new Map<string, ArticleMeta>()

  constructor() {
    super({
      log: ['error', 'warn'],
    })

    const now = new Date().toISOString()
    for (const item of INITIAL_ARTICLES) {
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
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL not set — using resilient in-memory store with Prisma schema contract',
      )
      return
    }

    try {
      await this.$connect()
      this.dbConnected = true
      this.logger.log('Connected to PostgreSQL via Prisma ORM')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.warn(
        `PostgreSQL connection unavailable (${message}) — falling back to resilient in-memory store`,
      )
      this.dbConnected = false
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dbConnected) {
      await this.$disconnect()
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
    if (this.dbConnected) {
      try {
        const created = await this.visitorSession.create({
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
    if (this.dbConnected) {
      try {
        const rows = await this.articleMetrics.findMany({
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
    if (this.dbConnected) {
      try {
        const updated = await this.articleMetrics.upsert({
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
    if (this.dbConnected) {
      try {
        const updated = await this.articleMetrics.upsert({
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
    if (!this.dbConnected) {
      return
    }
    try {
      await this.systemEventLog.create({
        data: {
          eventType,
          payload: JSON.parse(JSON.stringify(payload)),
        },
      })
    } catch (err) {
      this.logger.warn(`Prisma logSystemEvent fallback: ${String(err)}`)
    }
  }
}
