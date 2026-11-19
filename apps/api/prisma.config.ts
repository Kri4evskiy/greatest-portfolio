import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { defineConfig } from 'prisma/config'

for (const envPath of [resolve(import.meta.dirname, '.env'), resolve(import.meta.dirname, '../../.env')]) {
  if (existsSync(envPath)) {
    loadEnvFile(envPath)
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/migrations/scripts/seed.ts',
  },
  datasource: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
