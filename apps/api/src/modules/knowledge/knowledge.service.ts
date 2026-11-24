import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  type ArticleMeta,
  type KnowledgeCategory,
  type PaginatedArticleMetricsQuery,
  type PaginatedArticleMetricsResponse,
  type SessionProfile,
  VISITOR_ROLE_LABELS,
} from '@repo/shared-schemas'
import { KNOWN_KNOWLEDGE_SLUGS } from '../../migrations/scripts/seed-data.js'
import { PrismaService } from '../../prisma/prisma.service.js'
import { TelemetryService } from '../telemetry/telemetry.service.js'

const MAX_HELPFUL_DEDUP_KEYS = 2000

function resolvePublicActorLabel(actor?: SessionProfile | undefined): string {
  return actor?.visitorType ? VISITOR_ROLE_LABELS[actor.visitorType] : 'Reader'
}

@Injectable()
export class KnowledgeService {
  // Bounded per-(sessionId, slug) deduplication set preventing repeated helpful inflation
  // within the same session (will move to Redis SADD/EXPIRE in Priority #1).
  private readonly helpfulReactionsBySession = new Set<string>()

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TelemetryService) private readonly telemetry: TelemetryService,
  ) {}

  private assertKnownArticleSlug(slug: string): void {
    if (!KNOWN_KNOWLEDGE_SLUGS.has(slug)) {
      throw new NotFoundException(`Unknown knowledge article slug: "${slug}"`)
    }
  }

  private rememberHelpfulReaction(dedupKey: string): void {
    if (this.helpfulReactionsBySession.size >= MAX_HELPFUL_DEDUP_KEYS) {
      const oldestKey = this.helpfulReactionsBySession.values().next().value
      if (oldestKey) {
        this.helpfulReactionsBySession.delete(oldestKey)
      }
    }
    this.helpfulReactionsBySession.add(dedupKey)
  }

  async getAllMetrics(): Promise<ArticleMeta[]> {
    return this.prisma.getAllArticleMetrics()
  }

  async getPaginatedMetrics(query: PaginatedArticleMetricsQuery): Promise<PaginatedArticleMetricsResponse> {
    return this.prisma.getPaginatedArticleMetrics(query)
  }

  async recordView(
    slug: string,
    category: KnowledgeCategory,
    actor?: SessionProfile | undefined,
  ): Promise<ArticleMeta> {
    this.assertKnownArticleSlug(slug)
    const updated = await this.prisma.incrementArticleView(slug, category)

    await this.telemetry.publishEvent({
      type: 'ARTICLE_VIEWED',
      message: `${resolvePublicActorLabel(actor)} opened article "${slug}" (${updated.viewsCount} views)`,
      actorRole: actor?.visitorType ?? undefined,
      slug,
    })

    return updated
  }

  async recordHelpful(
    slug: string,
    category: KnowledgeCategory,
    actor?: SessionProfile | undefined,
  ): Promise<ArticleMeta> {
    this.assertKnownArticleSlug(slug)

    const sessionId = actor?.id
    if (sessionId) {
      const dedupKey = `${sessionId}:${slug}`
      if (this.helpfulReactionsBySession.has(dedupKey)) {
        return this.prisma.getArticleMetricBySlug(slug, category)
      }
      this.rememberHelpfulReaction(dedupKey)
    }

    const updated = await this.prisma.incrementArticleHelpful(slug, category)

    await this.telemetry.publishEvent({
      type: 'ARTICLE_HELPFUL',
      message: `${resolvePublicActorLabel(actor)} marked "${slug}" as Helpful (${updated.helpfulCount} reactions)`,
      actorRole: actor?.visitorType ?? undefined,
      slug,
    })

    return updated
  }
}
