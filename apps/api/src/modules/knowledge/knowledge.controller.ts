import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import type { SessionProfile } from '@repo/shared-schemas'
import type { Request } from 'express'
import { type PaginationQueryDto, PaginationQuerySchema } from '../../common/dto/pagination-query.dto.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { JwtRolesGuard } from '../auth/guards/jwt-roles.guard.js'
import {
  type ArticleMeta,
  type ArticleReactionBody,
  ArticleReactionBodySchema,
  ArticleReactionInputSchema,
  type KnowledgeCategory,
  type PaginatedArticleMetricsResponse,
} from './dto/knowledge.dto.js'
import { KnowledgeService } from './knowledge.service.js'

const ArticleSlugPipe = new ZodValidationPipe(ArticleReactionInputSchema.shape.slug)
const ArticleReactionBodyPipe = new ZodValidationPipe(ArticleReactionBodySchema)
const PaginationQueryPipe = new ZodValidationPipe(PaginationQuerySchema)

@Controller('knowledge')
@UseGuards(JwtRolesGuard)
export class KnowledgeController {
  constructor(
    @Inject(KnowledgeService)
    private readonly knowledgeService: KnowledgeService,
  ) {}

  @Get('metrics')
  @Roles('USER', 'ADMIN')
  async getMetrics(): Promise<ArticleMeta[]> {
    return this.knowledgeService.getAllMetrics()
  }

  @Get('metrics/paginated')
  @Roles('USER', 'ADMIN')
  async getPaginatedMetrics(
    @Query(PaginationQueryPipe) query: PaginationQueryDto,
  ): Promise<PaginatedArticleMetricsResponse> {
    return this.knowledgeService.getPaginatedMetrics(query)
  }

  @Post(':slug/view')
  @Roles('USER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async incrementView(
    @Param('slug', ArticleSlugPipe) slug: string,
    @Body(ArticleReactionBodyPipe) body: ArticleReactionBody,
    @Req() req: Request & { sessionProfile?: SessionProfile },
  ): Promise<ArticleMeta> {
    const category: KnowledgeCategory = body.category
    return this.knowledgeService.recordView(slug, category, req.sessionProfile)
  }

  @Post(':slug/helpful')
  @Roles('USER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async incrementHelpful(
    @Param('slug', ArticleSlugPipe) slug: string,
    @Body(ArticleReactionBodyPipe) body: ArticleReactionBody,
    @Req() req: Request & { sessionProfile?: SessionProfile },
  ): Promise<ArticleMeta> {
    const category: KnowledgeCategory = body.category
    return this.knowledgeService.recordHelpful(slug, category, req.sessionProfile)
  }
}
