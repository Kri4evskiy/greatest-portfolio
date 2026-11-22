import { z } from 'zod'

export const SystemModeEnum = z.enum(['demo', 'development', 'production'])
export type SystemMode = z.infer<typeof SystemModeEnum>

export const PersistenceModeEnum = z.enum(['postgresql', 'in-memory-fallback'])
export type PersistenceMode = z.infer<typeof PersistenceModeEnum>

export const RateLimiterModeEnum = z.enum(['redis', 'in-memory'])
export type RateLimiterMode = z.infer<typeof RateLimiterModeEnum>

export const SystemIntegrationsSchema = z.object({
  redisCache: z.boolean(),
  s3ObjectStorage: z.boolean(),
  telegramBotAuth: z.boolean(),
  sentryObservability: z.boolean(),
})
export type SystemIntegrations = z.infer<typeof SystemIntegrationsSchema>

export const SystemCapabilitiesSchema = z.object({
  status: z.literal('ok'),
  mode: SystemModeEnum,
  persistence: PersistenceModeEnum,
  rateLimiter: RateLimiterModeEnum,
  telemetryTcpConnected: z.boolean(),
  integrations: SystemIntegrationsSchema,
  timestamp: z.iso.datetime(),
})
export type SystemCapabilities = z.infer<typeof SystemCapabilitiesSchema>
