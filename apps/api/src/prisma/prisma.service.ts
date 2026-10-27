import { randomUUID } from 'node:crypto';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { ArticleMeta, KnowledgeCategory, Role, VisitorRoleType } from '@repo/shared-schemas';

export interface VisitorSessionRecord {
  id: string;
  displayName: string;
  visitorType: VisitorRoleType;
  role: Role;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
}

const INITIAL_ARTICLE_METRICS: readonly ArticleMeta[] = [
  {
    slug: 'adr-full-stack-catalog',
    category: 'architecture-devops',
    viewsCount: 142,
    helpfulCount: 48,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'react-18-vs-19-compiler-and-fiber',
    category: 'react',
    viewsCount: 98,
    helpfulCount: 37,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'strict-typescript-zod-contracts',
    category: 'typescript',
    viewsCount: 84,
    helpfulCount: 29,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'nestjs-jwt-httponly-rbac-prisma',
    category: 'nestjs-prisma',
    viewsCount: 116,
    helpfulCount: 41,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'tanstack-redact-bundle-experiment',
    category: 'architecture-devops',
    viewsCount: 73,
    helpfulCount: 26,
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private client: PrismaClient | null = null;
  private isDatabaseConnected = false;

  // Fallback in-memory stores when DATABASE_URL (Neon/Docker Postgres) is not yet configured
  private readonly memorySessions = new Map<string, VisitorSessionRecord>();
  private readonly memoryMetrics = new Map<string, ArticleMeta>();
  private readonly memoryEventLogs: Array<{
    id: string;
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: Date;
  }> = [];

  constructor() {
    for (const item of INITIAL_ARTICLE_METRICS) {
      this.memoryMetrics.set(item.slug, { ...item });
    }
  }

  async onModuleInit(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.warn(
        'DATABASE_URL is not set — running with pre-seeded In-Memory store (set Neon.tech or Docker DATABASE_URL for PostgreSQL persistence).',
      );
      return;
    }

    try {
      this.client = new PrismaClient();
      await this.client.$connect();
      this.isDatabaseConnected = true;
      this.logger.log('Connected to PostgreSQL via Prisma ORM.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Could not connect to PostgreSQL (${msg}). Falling back to In-Memory store so dev server stays up.`,
      );
      this.client = null;
      this.isDatabaseConnected = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && this.isDatabaseConnected) {
      await this.client.$disconnect();
    }
  }

  async createVisitorSession(input: {
    displayName: string;
    visitorType: VisitorRoleType;
    role: Role;
    userAgent: string | null;
    expiresAt: Date;
  }): Promise<VisitorSessionRecord> {
    if (this.client && this.isDatabaseConnected) {
      try {
        const created = await this.client.visitorSession.create({
          data: {
            displayName: input.displayName,
            visitorType: input.visitorType,
            role: input.role,
            userAgent: input.userAgent,
            expiresAt: input.expiresAt,
          },
        });
        return {
          id: created.id,
          displayName: created.displayName,
          visitorType: created.visitorType as VisitorRoleType,
          role: created.role as Role,
          userAgent: created.userAgent,
          createdAt: created.createdAt,
          expiresAt: created.expiresAt,
        };
      } catch {
        // Fallback to memory on transient DB schema/network errors
      }
    }

    const record: VisitorSessionRecord = {
      id: randomUUID(),
      displayName: input.displayName,
      visitorType: input.visitorType,
      role: input.role,
      userAgent: input.userAgent,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
    };
    this.memorySessions.set(record.id, record);
    return record;
  }

  async getAllArticleMetrics(): Promise<ArticleMeta[]> {
    if (this.client && this.isDatabaseConnected) {
      try {
        const rows = await this.client.articleMetrics.findMany({
          orderBy: { viewsCount: 'desc' },
        });
        if (rows.length > 0) {
          return rows.map((row) => ({
            slug: row.slug,
            category: row.category as KnowledgeCategory,
            viewsCount: row.viewsCount,
            helpfulCount: row.helpfulCount,
            updatedAt: row.updatedAt.toISOString(),
          }));
        }
      } catch {
        // Fallback to memory
      }
    }
    return Array.from(this.memoryMetrics.values());
  }

  async incrementArticleView(slug: string, category: KnowledgeCategory): Promise<ArticleMeta> {
    if (this.client && this.isDatabaseConnected) {
      try {
        const updated = await this.client.articleMetrics.upsert({
          where: { slug },
          update: { viewsCount: { increment: 1 } },
          create: { slug, category, viewsCount: 1, helpfulCount: 0 },
        });
        return {
          slug: updated.slug,
          category: updated.category as KnowledgeCategory,
          viewsCount: updated.viewsCount,
          helpfulCount: updated.helpfulCount,
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch {
        // Fallback to memory
      }
    }

    const existing = this.memoryMetrics.get(slug);
    const next: ArticleMeta = existing
      ? {
          ...existing,
          viewsCount: existing.viewsCount + 1,
          updatedAt: new Date().toISOString(),
        }
      : {
          slug,
          category,
          viewsCount: 1,
          helpfulCount: 0,
          updatedAt: new Date().toISOString(),
        };
    this.memoryMetrics.set(slug, next);
    return next;
  }

  async incrementArticleHelpful(slug: string, category: KnowledgeCategory): Promise<ArticleMeta> {
    if (this.client && this.isDatabaseConnected) {
      try {
        const updated = await this.client.articleMetrics.upsert({
          where: { slug },
          update: { helpfulCount: { increment: 1 } },
          create: { slug, category, viewsCount: 1, helpfulCount: 1 },
        });
        return {
          slug: updated.slug,
          category: updated.category as KnowledgeCategory,
          viewsCount: updated.viewsCount,
          helpfulCount: updated.helpfulCount,
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch {
        // Fallback to memory
      }
    }

    const existing = this.memoryMetrics.get(slug);
    const next: ArticleMeta = existing
      ? {
          ...existing,
          helpfulCount: existing.helpfulCount + 1,
          updatedAt: new Date().toISOString(),
        }
      : {
          slug,
          category,
          viewsCount: 1,
          helpfulCount: 1,
          updatedAt: new Date().toISOString(),
        };
    this.memoryMetrics.set(slug, next);
    return next;
  }

  async logSystemEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    if (this.client && this.isDatabaseConnected) {
      try {
        await this.client.systemEventLog.create({
          data: {
            eventType,
            payload: JSON.parse(JSON.stringify(payload)),
          },
        });
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memoryEventLogs.push({
      id: randomUUID(),
      eventType,
      payload,
      createdAt: new Date(),
    });
  }
}
