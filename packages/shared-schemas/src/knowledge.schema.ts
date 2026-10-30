import { z } from 'zod'

export const KnowledgeCategoryEnum = z.enum([
  'typescript',
  'react',
  'nestjs-prisma',
  'architecture-devops',
])
export type KnowledgeCategory = z.infer<typeof KnowledgeCategoryEnum>

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  typescript: 'TypeScript & Contracts',
  react: 'React 18 vs 19 & Next.js',
  'nestjs-prisma': 'NestJS, Prisma & Security',
  'architecture-devops': 'Architecture, Docker & Redact',
}

export const ArticleMetaSchema = z.object({
  slug: z.string().min(1),
  category: KnowledgeCategoryEnum,
  viewsCount: z.number().int().nonnegative(),
  helpfulCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
})
export type ArticleMeta = z.infer<typeof ArticleMetaSchema>

export const ArticleReactionInputSchema = z.object({
  slug: z.string().min(1),
  category: KnowledgeCategoryEnum,
})
export type ArticleReactionInput = z.infer<typeof ArticleReactionInputSchema>
