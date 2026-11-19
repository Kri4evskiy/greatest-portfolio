import { z } from 'zod'

const DatabaseEnvSchema = z.object({
  DATABASE_URL: z.string().trim().optional(),
  DIRECT_URL: z.string().trim().optional(),
})

export interface DatabaseConfig {
  databaseUrl: string | undefined
  directUrl: string | undefined
  isConfigured: boolean
}

/**
 * Validates database connection environment variables.
 * Allows empty values for air-gapped / in-memory fallback mode.
 */
export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const parsed = DatabaseEnvSchema.safeParse(env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid database environment configuration: ${details}`)
  }

  const databaseUrl = parsed.data.DATABASE_URL || undefined
  const directUrl = parsed.data.DIRECT_URL || undefined

  return {
    databaseUrl,
    directUrl,
    isConfigured: Boolean(databaseUrl),
  }
}

export function extractPostgresSchema(connectionString: string): string | undefined {
  try {
    return new URL(connectionString).searchParams.get('schema') || undefined
  } catch {
    return undefined
  }
}

export const databaseConfig: DatabaseConfig = loadDatabaseConfig()
