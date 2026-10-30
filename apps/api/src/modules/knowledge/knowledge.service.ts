import { Inject, Injectable } from '@nestjs/common'
import type { ArticleMeta, KnowledgeCategory, SessionProfile } from '@repo/shared-schemas'
import { PrismaService } from '../../prisma/prisma.service.js'
import { TelemetryService } from '../telemetry/telemetry.service.js'

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TelemetryService) private readonly telemetry: TelemetryService,
  ) {}

  async getAllMetrics(): Promise<ArticleMeta[]> {
    return this.prisma.getAllArticleMetrics()
  }

  async recordView(
    slug: string,
    category: KnowledgeCategory,
    actor?: SessionProfile | undefined,
  ): Promise<ArticleMeta> {
    const updated = await this.prisma.incrementArticleView(slug, category)

    await this.telemetry.publishEvent({
      type: 'ARTICLE_VIEWED',
      message: `${actor?.displayName ?? 'Reader'} opened article "${slug}" (${updated.viewsCount} views)`,
      actorName: actor?.displayName ?? undefined,
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
      message: `${actor?.displayName ?? 'Reader'} marked "${slug}" as Helpful (${updated.helpfulCount} reactions)`,
      actorName: actor?.displayName ?? undefined,
      actorRole: actor?.visitorType ?? undefined,
      slug,
    })

    return updated
  }
}
