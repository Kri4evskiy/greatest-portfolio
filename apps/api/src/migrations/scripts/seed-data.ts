import type { KnowledgeCategory } from '@repo/shared-schemas'

export interface ArticleMetricSeed {
  slug: string
  category: KnowledgeCategory
  viewsCount: number
  helpfulCount: number
}

export const INITIAL_ARTICLE_SEEDS: readonly ArticleMetricSeed[] = [
  {
    slug: 'adr-full-stack-catalog',
    category: 'typescript',
    viewsCount: 142,
    helpfulCount: 38,
  },
  {
    slug: 'react-18-vs-19-compiler-d3',
    category: 'react',
    viewsCount: 198,
    helpfulCount: 64,
  },
  {
    slug: 'nestjs-jwt-httponly-prisma-sse',
    category: 'nestjs-prisma',
    viewsCount: 167,
    helpfulCount: 51,
  },
  {
    slug: 'indexeddb-bundle-diet-docker',
    category: 'architecture-devops',
    viewsCount: 129,
    helpfulCount: 44,
  },
]
