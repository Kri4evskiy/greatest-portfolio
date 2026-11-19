import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { extractPostgresSchema } from '../../config/database.config.js'
import { PrismaClient } from '../../generated/prisma/client.js'
import { INITIAL_ARTICLE_SEEDS } from './seed-data.js'

for (const envPath of [
  resolve(import.meta.dirname, '../../../.env'),
  resolve(import.meta.dirname, '../../../../../.env'),
]) {
  if (existsSync(envPath)) {
    loadEnvFile(envPath)
  }
}

/**
 * Idempotent database seed script for initial Knowledge Base article metrics.
 * Usage: `tsx src/migrations/scripts/seed.ts` (or `prisma db seed`)
 */
async function runSeed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required to run database seed.')
  }

  const pool = new Pool({ connectionString })
  const schema = extractPostgresSchema(connectionString)
  const adapter = schema ? new PrismaPg(pool, { schema }) : new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

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
    await pool.end()
  }
}

runSeed().catch((error: unknown) => {
  console.error('Database seed failed:', error)
  process.exit(1)
})
