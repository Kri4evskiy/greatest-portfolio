import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Req, UseGuards } from '@nestjs/common'
import type { SessionProfile } from '@repo/shared-schemas'
import type { Request } from 'express'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { JwtRolesGuard } from '../auth/guards/jwt-roles.guard.js'
import {
  type ArticleMeta,
  type ArticleReactionBody,
  ArticleReactionBodySchema,
  ArticleReactionInputSchema,
  type KnowledgeCategory,
} from './dto/knowledge.dto.js'
import { KnowledgeService } from './knowledge.service.js'

const ArticleSlugPipe = new ZodValidationPipe(ArticleReactionInputSchema.shape.slug)
const ArticleReactionBodyPipe = new ZodValidationPipe(ArticleReactionBodySchema)

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
