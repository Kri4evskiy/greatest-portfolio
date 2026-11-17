import { DEFAULT_DEV_JWT_SECRET, resolveJwtSecret } from '@repo/shared-schemas'
import { z } from 'zod'

const DEFAULT_DEV_ADMIN_PASSCODE = 'workfolio-admin-2026'
const MIN_PROD_JWT_SECRET_LENGTH = 32

const AppEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().trim().min(1).default('http://localhost:3000'),
  JWT_SECRET: z.string().trim().optional(),
  ADMIN_SECRET_PASSCODE: z.string().trim().min(1).default(DEFAULT_DEV_ADMIN_PASSCODE),
  TELEMETRY_MS_HOST: z.string().trim().min(1).default('127.0.0.1'),
  TELEMETRY_MS_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  SENTRY_DSN: z.string().trim().optional(),
})

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test'
  isProduction: boolean
  port: number
  webOrigin: string
  allowedOrigins: string[]
  jwtSecret: string
  adminSecretPasscode: string
  telemetryMsHost: string
  telemetryMsPort: number
  sentryDsn: string | undefined
}

/**
 * Validates and builds the typed application configuration from environment variables.
 * Rejects missing or default JWT secrets when NODE_ENV === 'production'.
 */
export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = AppEnvSchema.safeParse(env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid application environment configuration: ${details}`)
  }

  const data = parsed.data
  const isProduction = data.NODE_ENV === 'production'

  if (isProduction) {
    const rawSecret = data.JWT_SECRET ?? ''
    if (rawSecret.length < MIN_PROD_JWT_SECRET_LENGTH || rawSecret === DEFAULT_DEV_JWT_SECRET) {
      throw new Error(
        `Security violation: JWT_SECRET must be explicitly set to a non-default secret (>= ${MIN_PROD_JWT_SECRET_LENGTH} chars) when NODE_ENV=production`,
      )
    }

    if (data.ADMIN_SECRET_PASSCODE === DEFAULT_DEV_ADMIN_PASSCODE) {
      throw new Error(
        'Security violation: ADMIN_SECRET_PASSCODE must be explicitly overridden when NODE_ENV=production',
      )
    }
  }

  const allowedOrigins = isProduction
    ? data.WEB_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [data.WEB_ORIGIN, 'http://127.0.0.1:3000']

  return {
    nodeEnv: data.NODE_ENV,
    isProduction,
    port: data.PORT,
    webOrigin: data.WEB_ORIGIN,
    allowedOrigins,
    jwtSecret: resolveJwtSecret(data.JWT_SECRET),
    adminSecretPasscode: data.ADMIN_SECRET_PASSCODE,
    telemetryMsHost: data.TELEMETRY_MS_HOST,
    telemetryMsPort: data.TELEMETRY_MS_PORT,
    sentryDsn: data.SENTRY_DSN || undefined,
  }
}

export const appConfig: AppConfig = loadAppConfig()
