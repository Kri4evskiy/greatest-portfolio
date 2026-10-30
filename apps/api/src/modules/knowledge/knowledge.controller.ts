import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  type ArticleMeta,
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type SessionProfile,
} from '@repo/shared-schemas';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { JwtRolesGuard } from '../auth/jwt-roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { KnowledgeService } from './knowledge.service.js';

const CategoryBodySchema = z.object({
  category: KnowledgeCategoryEnum.optional().default('typescript'),
});

type CategoryBody = z.infer<typeof CategoryBodySchema>;

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
    return this.knowledgeService.getAllMetrics();
  }

  @Post(':slug/view')
  @Roles('USER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async incrementView(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(CategoryBodySchema)) body: CategoryBody,
    @Req() req: Request & { sessionProfile?: SessionProfile },
  ): Promise<ArticleMeta> {
    const category: KnowledgeCategory = body.category;
    return this.knowledgeService.recordView(slug, category, req.sessionProfile);
  }

  @Post(':slug/helpful')
  @Roles('USER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async incrementHelpful(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(CategoryBodySchema)) body: CategoryBody,
    @Req() req: Request & { sessionProfile?: SessionProfile },
  ): Promise<ArticleMeta> {
    const category: KnowledgeCategory = body.category;
    return this.knowledgeService.recordHelpful(slug, category, req.sessionProfile);
  }
}
