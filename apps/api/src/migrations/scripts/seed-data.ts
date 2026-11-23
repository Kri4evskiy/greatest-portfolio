import type { KnowledgeCategory } from '@repo/shared-schemas'

export interface ArticleMetricSeed {
  slug: string
  category: KnowledgeCategory
  viewsCount: number
  helpfulCount: number
}

export const INITIAL_ARTICLE_SEEDS: readonly ArticleMetricSeed[] = [
  {
    slug: 'this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki',
    category: 'this-project',
    viewsCount: 214,
    helpfulCount: 72,
  },
  {
    slug: 'react-18-vs-19-compiler-d3',
    category: 'react',
    viewsCount: 198,
    helpfulCount: 64,
  },
  {
    slug: 'this-project--frontend-architecture--edge-web-crypto-jwt-proxy',
    category: 'this-project',
    viewsCount: 184,
    helpfulCount: 59,
  },
  {
    slug: 'databases-sql--indexing--database-indexing-deep-dive',
    category: 'databases-sql',
    viewsCount: 175,
    helpfulCount: 55,
  },
  {
    slug: 'nestjs-jwt-httponly-prisma-sse',
    category: 'nestjs-prisma',
    viewsCount: 167,
    helpfulCount: 51,
  },
  {
    slug: 'strict-typescript-zod-contracts',
    category: 'typescript',
    viewsCount: 156,
    helpfulCount: 47,
  },
  {
    slug: 'nestjs--ai-mcp--nestjs-ai-and-mcp-architecture',
    category: 'nestjs',
    viewsCount: 151,
    helpfulCount: 49,
  },
  {
    slug: 'adr-full-stack-catalog',
    category: 'typescript',
    viewsCount: 142,
    helpfulCount: 38,
  },
  {
    slug: 'testing--backend--smoke-tests-and-backend-testing-taxonomy',
    category: 'testing',
    viewsCount: 134,
    helpfulCount: 42,
  },
  {
    slug: 'indexeddb-bundle-diet-docker',
    category: 'architecture-devops',
    viewsCount: 129,
    helpfulCount: 44,
  },
]
