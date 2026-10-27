import { Injectable } from '@nestjs/common';
import type { ArticleMeta, KnowledgeCategory, VisitorRoleType } from '@repo/shared-schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetry: TelemetryService,
  ) {}

  async getAllMetrics(): Promise<ArticleMeta[]> {
    return this.prisma.getAllArticleMetrics();
  }

  async recordView(
    slug: string,
    category: KnowledgeCategory,
    actorName?: string,
    actorRole?: VisitorRoleType,
  ): Promise<ArticleMeta> {
    const updated = await this.prisma.incrementArticleView(slug, category);
    await this.telemetry.emitEvent({
      type: 'ARTICLE_VIEWED',
      message: `${actorName ?? 'Reader'} opened article "${slug}" (${updated.viewsCount} views)`,
      actorName,
      actorRole,
      slug,
    });
    return updated;
  }

  async recordHelpful(
    slug: string,
    category: KnowledgeCategory,
    actorName?: string,
    actorRole?: VisitorRoleType,
  ): Promise<ArticleMeta> {
    const updated = await this.prisma.incrementArticleHelpful(slug, category);
    await this.telemetry.emitEvent({
      type: 'ARTICLE_HELPFUL',
      message: `${actorName ?? 'Reader'} marked "${slug}" as Helpful (${updated.helpfulCount} helpful)`,
      actorName,
      actorRole,
      slug,
    });
    return updated;
  }
}
