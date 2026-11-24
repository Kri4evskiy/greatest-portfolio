import { DEFAULT_DEV_JWT_SECRET, resolveJwtSecret, type SystemIntegrations } from '@repo/shared-schemas'
import { z } from 'zod'

const DEFAULT_DEV_ADMIN_PASSCODE = 'workfolio-admin-2026'
const MIN_PROD_JWT_SECRET_LENGTH = 32
const MIN_PROD_ADMIN_PASSCODE_LENGTH = 16

const AppEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WORKFOLIO_DEMO_MODE: z.enum(['true', 'false']).optional().default('false'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  WEB_ORIGIN: z.string().trim().min(1).default('http://localhost:3000'),
  JWT_SECRET: z.string().trim().optional(),
  ADMIN_SECRET_PASSCODE: z.string().trim().min(1).default(DEFAULT_DEV_ADMIN_PASSCODE),
  TELEMETRY_MS_HOST: z.string().trim().min(1).default('127.0.0.1'),
  TELEMETRY_MS_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  SENTRY_DSN: z.string().trim().optional(),
  REDIS_URL: z.string().trim().optional(),
  S3_ENDPOINT: z.string().trim().optional(),
  S3_BUCKET: z.string().trim().optional(),
  S3_ACCESS_KEY_ID: z.string().trim().optional(),
  S3_SECRET_ACCESS_KEY: z.string().trim().optional(),
  TELEGRAM_BOT_TOKEN: z.string().trim().optional(),
})

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test'
  isProduction: boolean
  isDemoMode: boolean
  port: number
  trustProxyHops: number
  webOrigin: string
  allowedOrigins: string[]
  jwtSecret: string
  adminSecretPasscode: string
  telemetryMsHost: string
  telemetryMsPort: number
  sentryDsn: string | undefined
  integrations: SystemIntegrations
}

/**
 * Validates and builds the typed application configuration from environment variables.
 * Rejects missing or default JWT secrets when NODE_ENV === 'production' (unless WORKFOLIO_DEMO_MODE === 'true').
 */
export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = AppEnvSchema.safeParse(env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid application environment configuration: ${details}`)
  }

  const data = parsed.data
  const isProduction = data.NODE_ENV === 'production'
  const isDemoMode = data.WORKFOLIO_DEMO_MODE === 'true'

  if (isProduction && !isDemoMode) {
    const rawSecret = data.JWT_SECRET ?? ''
    if (rawSecret.length < MIN_PROD_JWT_SECRET_LENGTH || rawSecret === DEFAULT_DEV_JWT_SECRET) {
      throw new Error(
        `Security violation: JWT_SECRET must be explicitly set to a non-default secret (>= ${MIN_PROD_JWT_SECRET_LENGTH} chars) when NODE_ENV=production`,
      )
    }

    if (
      data.ADMIN_SECRET_PASSCODE === DEFAULT_DEV_ADMIN_PASSCODE ||
      data.ADMIN_SECRET_PASSCODE.length < MIN_PROD_ADMIN_PASSCODE_LENGTH
    ) {
      throw new Error(
        `Security violation: ADMIN_SECRET_PASSCODE must be explicitly overridden with a strong secret (>= ${MIN_PROD_ADMIN_PASSCODE_LENGTH} chars) when NODE_ENV=production`,
      )
    }
  } else if (isProduction && isDemoMode) {
    const rawSecret = data.JWT_SECRET ?? ''
    if (rawSecret.length > 0 && rawSecret.length < MIN_PROD_JWT_SECRET_LENGTH) {
      throw new Error(
        `Security violation: JWT_SECRET in WORKFOLIO_DEMO_MODE must be at least ${MIN_PROD_JWT_SECRET_LENGTH} characters`,
      )
    }
    console.warn(
      '[WORKFOLIO DEMO MODE] Running with local reviewer demo credentials. Use docker-compose.prod.yml with explicit secrets for real cloud deployments.',
    )
  }

  const configuredOrigins = data.WEB_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const allowedOrigins =
    isProduction && !isDemoMode
      ? configuredOrigins
      : Array.from(new Set([...configuredOrigins, 'http://localhost:3000', 'http://127.0.0.1:3000']))

  return {
    nodeEnv: data.NODE_ENV,
    isProduction,
    isDemoMode,
    port: data.PORT,
    trustProxyHops: data.TRUST_PROXY_HOPS,
    webOrigin: data.WEB_ORIGIN,
    allowedOrigins,
    jwtSecret: resolveJwtSecret(data.JWT_SECRET),
    adminSecretPasscode: data.ADMIN_SECRET_PASSCODE,
    telemetryMsHost: data.TELEMETRY_MS_HOST,
    telemetryMsPort: data.TELEMETRY_MS_PORT,
    sentryDsn: data.SENTRY_DSN || undefined,
    integrations: {
      redisCache: Boolean(data.REDIS_URL),
      s3ObjectStorage: Boolean(
        data.S3_ENDPOINT && data.S3_BUCKET && data.S3_ACCESS_KEY_ID && data.S3_SECRET_ACCESS_KEY,
      ),
      telegramBotAuth: Boolean(data.TELEGRAM_BOT_TOKEN),
      sentryObservability: Boolean(data.SENTRY_DSN),
    },
  }
}

export const appConfig: AppConfig = loadAppConfig()
