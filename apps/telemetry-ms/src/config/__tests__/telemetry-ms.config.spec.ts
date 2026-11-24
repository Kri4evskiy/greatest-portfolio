import { describe, expect, it } from 'vitest'
import { loadTelemetryMsConfig } from '../telemetry-ms.config.js'

describe('loadTelemetryMsConfig (Zod env validation & loopback default)', () => {
  it('defaults to loopback 127.0.0.1:4001 when env vars are omitted or blank', () => {
    expect(loadTelemetryMsConfig({})).toEqual({
      host: '127.0.0.1',
      port: 4001,
    })

    expect(loadTelemetryMsConfig({ TELEMETRY_MS_PORT: '   ' })).toEqual({
      host: '127.0.0.1',
      port: 4001,
    })
  })

  it('accepts explicit host and numeric port overrides (e.g. Docker backend-network)', () => {
    expect(
      loadTelemetryMsConfig({
        TELEMETRY_MS_HOST: '0.0.0.0',
        TELEMETRY_MS_PORT: '4050',
      }),
    ).toEqual({
      host: '0.0.0.0',
      port: 4050,
    })
  })

  it('rejects non-numeric, zero, or out-of-range TCP ports', () => {
    expect(() => loadTelemetryMsConfig({ TELEMETRY_MS_PORT: 'abc' })).toThrow(/TELEMETRY_MS_PORT/i)
    expect(() => loadTelemetryMsConfig({ TELEMETRY_MS_PORT: '0' })).toThrow(/TELEMETRY_MS_PORT/i)
    expect(() => loadTelemetryMsConfig({ TELEMETRY_MS_PORT: '70000' })).toThrow(/TELEMETRY_MS_PORT/i)
  })
})
