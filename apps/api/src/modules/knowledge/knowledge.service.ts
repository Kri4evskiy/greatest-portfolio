import { Inject, Injectable } from '@nestjs/common'
import {
  type ArticleMeta,
  type KnowledgeCategory,
  type PaginatedArticleMetricsResponse,
  type SessionProfile,
  VISITOR_ROLE_LABELS,
} from '@repo/shared-schemas'
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js'
import { PrismaService } from '../../prisma/prisma.service.js'
import { TelemetryService } from '../telemetry/telemetry.service.js'

function resolvePublicActorLabel(actor?: SessionProfile | undefined): string {
  return actor?.visitorType ? VISITOR_ROLE_LABELS[actor.visitorType] : 'Reader'
}

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TelemetryService) private readonly telemetry: TelemetryService,
  ) {}

  async getAllMetrics(): Promise<ArticleMeta[]> {
    return this.prisma.getAllArticleMetrics()
  }

  async getPaginatedMetrics(query: PaginationQueryDto): Promise<PaginatedArticleMetricsResponse> {
    return this.prisma.getPaginatedArticleMetrics(query)
  }

  async recordView(
    slug: string,
    category: KnowledgeCategory,
    actor?: SessionProfile | undefined,
  ): Promise<ArticleMeta> {
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
