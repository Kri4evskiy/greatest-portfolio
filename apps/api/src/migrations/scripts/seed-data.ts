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

/**
 * Strict allowlist of valid Knowledge Base article slugs across all repository MDX modules.
 * Prevents arbitrary user-supplied `:slug` strings from causing unbounded PostgreSQL `ArticleMetrics`
 * upserts or in-memory Map growth (C4 DoS/DB-bloat defense).
 */
export const KNOWN_KNOWLEDGE_SLUGS: ReadonlySet<string> = new Set([
  ...INITIAL_ARTICLE_SEEDS.map((item) => item.slug),
  'gof-design-patterns-in-typescript-and-nestjs',
  'others--security--zero-trust-web-security-in-ai-agent-era',
  'react--compiler--auto-memoization-rules',
  'react--compiler--debugging-opt-out-directives',
  'react--react-19--form-actions-optimistic-ui',
  'react--react-19--use-hook-actions-rsc',
  'testing--backend--backend-integration-database-and-contract-testing',
  'testing--backend--load-chaos-mutation-and-ci-testing-strategy',
  'this-project--backend-architecture--nestjs-12-esm-prisma-7-sse-graceful-architecture',
  'this-project--design-system--multi-theme-tokens-tailwind-preset',
  'this-project--design-system--programmatic-scrollspy-section-nav',
  'this-project--frontend-architecture--production-seo-i18n-sitemap-architecture',
  'this-project--frontend-architecture--react-compiler-config-boundaries',
  'this-project--frontend-architecture--rsc-locale-slicing-client-islands',
  'this-project--knowledge-engine--static-search-index-cmdk-palette',
  'this-project--monorepo-docker--github-actions-ci-pipeline',
  'this-project--monorepo-docker--multi-stage-buildkit-docker',
  'this-project--monorepo-docker--pnpm-turborepo-tsconfig-biome',
  'this-project--security--production-security-hardening-csp-helmet-throttler',
  'this-project--testing-qa--vitest-playwright-enterprise-testing-pyramid',
])
