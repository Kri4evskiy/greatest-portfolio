import { PrismaClient } from '@prisma/client'
import { INITIAL_ARTICLE_SEEDS } from './seed-data.js'

/**
 * Idempotent database seed script for initial Knowledge Base article metrics.
 * Usage: `tsx src/migrations/scripts/seed.ts`
 */
async function runSeed(): Promise<void> {
  const prisma = new PrismaClient()
  await prisma.$connect()

  try {
    for (const article of INITIAL_ARTICLE_SEEDS) {
      await prisma.articleMetrics.upsert({
        where: { slug: article.slug },
        update: {},
        create: {
          slug: article.slug,
          category: article.category,
          viewsCount: article.viewsCount,
          helpfulCount: article.helpfulCount,
        },
      })
    }
    console.info(`Seeded ${INITIAL_ARTICLE_SEEDS.length} initial ArticleMetrics records.`)
  } finally {
    await prisma.$disconnect()
  }
}

runSeed().catch((error: unknown) => {
  console.error('Database seed failed:', error)
  process.exit(1)
})
