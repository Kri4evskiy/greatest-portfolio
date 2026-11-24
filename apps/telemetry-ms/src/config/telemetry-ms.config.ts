import { z } from 'zod'

const TelemetryMsEnvSchema = z.object({
  // Default to loopback (127.0.0.1) so local runs never expose unauthenticated TCP on LAN;
  // Docker Compose explicitly overrides TELEMETRY_MS_HOST=0.0.0.0 inside isolated backend-network.
  TELEMETRY_MS_HOST: z.string().trim().min(1).default('127.0.0.1'),
  TELEMETRY_MS_PORT: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.coerce.number().int().min(1).max(65535).default(4001),
  ),
})

export interface TelemetryMsConfig {
  host: string
  port: number
}

/**
 * Validates and builds typed configuration for the TCP Telemetry Microservice.
 */
export function loadTelemetryMsConfig(env: NodeJS.ProcessEnv = process.env): TelemetryMsConfig {
  const parsed = TelemetryMsEnvSchema.safeParse(env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid TelemetryMS environment configuration: ${details}`)
  }

  return {
    host: parsed.data.TELEMETRY_MS_HOST,
    port: parsed.data.TELEMETRY_MS_PORT,
  }
}
