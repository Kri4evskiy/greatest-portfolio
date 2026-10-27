import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  type ArticleMeta,
  type ArticleReactionInput,
  ArticleReactionInputSchema,
} from '@repo/shared-schemas';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedRequest, JwtRolesGuard } from '../auth/guards/jwt-roles.guard';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
@UseGuards(JwtRolesGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('metrics')
  @Roles('USER', 'ADMIN')
  async getMetrics(): Promise<{ items: ArticleMeta[] }> {
    const items = await this.knowledgeService.getAllMetrics();
    return { items };
  }

  @Post(':slug/view')
  @HttpCode(200)
  @Roles('USER', 'ADMIN')
  async incrementView(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(ArticleReactionInputSchema)) body: ArticleReactionInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<ArticleMeta> {
    return this.knowledgeService.recordView(
      slug,
      body.category,
      req.user?.displayName,
      req.user?.visitorType,
    );
  }

  @Post(':slug/helpful')
  @HttpCode(200)
  @Roles('USER', 'ADMIN')
  async incrementHelpful(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(ArticleReactionInputSchema)) body: ArticleReactionInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<ArticleMeta> {
    return this.knowledgeService.recordHelpful(
      slug,
      body.category,
      req.user?.displayName,
      req.user?.visitorType,
    );
  }
}
