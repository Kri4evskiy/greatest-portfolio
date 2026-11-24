import { DEFAULT_DEV_JWT_SECRET } from '@repo/shared-schemas'
import { describe, expect, it, vi } from 'vitest'
import { loadAppConfig } from '../app.config.js'

const STRONG_PROD_SECRET = 'prod-super-strong-jwt-secret-key-2026-min-32-chars'

describe('loadAppConfig (Zod env validation & production security guard)', () => {
  it('resolves safe development defaults and computes integration flags strictly', () => {
    const cfg = loadAppConfig({ NODE_ENV: 'development' })

    expect(cfg.isProduction).toBe(false)
    expect(cfg.isDemoMode).toBe(false)
    expect(cfg.port).toBe(4000)
    expect(cfg.jwtSecret).toBe(DEFAULT_DEV_JWT_SECRET)
    expect(cfg.allowedOrigins).toContain('http://localhost:3000')
    expect(cfg.integrations).toEqual({
      redisCache: false,
      s3ObjectStorage: false,
      telegramBotAuth: false,
      sentryObservability: false,
    })

    const withPartialS3 = loadAppConfig({
      NODE_ENV: 'development',
      REDIS_URL: 'redis://localhost:6379',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_BUCKET: 'workfolio',
      TELEGRAM_BOT_TOKEN: 'bot-token',
      SENTRY_DSN: 'https://sentry.example/1',
    })
    expect(withPartialS3.integrations).toEqual({
      redisCache: true,
      s3ObjectStorage: false,
      telegramBotAuth: true,
      sentryObservability: true,
    })
  })

  it('rejects default or short JWT_SECRET and default ADMIN_SECRET_PASSCODE in production', () => {
    expect(() =>
      loadAppConfig({
        NODE_ENV: 'production',
        WORKFOLIO_DEMO_MODE: 'false',
        ADMIN_SECRET_PASSCODE: 'custom-admin-pass',
      }),
    ).toThrow(/JWT_SECRET/i)

    expect(() =>
      loadAppConfig({
        NODE_ENV: 'production',
        JWT_SECRET: DEFAULT_DEV_JWT_SECRET,
        ADMIN_SECRET_PASSCODE: 'custom-admin-pass',
      }),
    ).toThrow(/JWT_SECRET/i)

    expect(() =>
      loadAppConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short-secret',
        ADMIN_SECRET_PASSCODE: 'custom-admin-pass',
      }),
    ).toThrow(/JWT_SECRET/i)

    expect(() =>
      loadAppConfig({
        NODE_ENV: 'production',
        JWT_SECRET: STRONG_PROD_SECRET,
      }),
    ).toThrow(/ADMIN_SECRET_PASSCODE/i)

    expect(() =>
      loadAppConfig({
        NODE_ENV: 'production',
        JWT_SECRET: STRONG_PROD_SECRET,
        ADMIN_SECRET_PASSCODE: 'short-pass',
      }),
    ).toThrow(/ADMIN_SECRET_PASSCODE/i)
  })

  it('accepts strong production secrets, parses TRUST_PROXY_HOPS, and locks allowedOrigins to configured WEB_ORIGIN', () => {
    const cfg = loadAppConfig({
      NODE_ENV: 'production',
      WORKFOLIO_DEMO_MODE: 'false',
      TRUST_PROXY_HOPS: '2',
      WEB_ORIGIN: 'https://workfolio.example, https://preview.workfolio.example',
      JWT_SECRET: STRONG_PROD_SECRET,
      ADMIN_SECRET_PASSCODE: 'custom-admin-pass-2026',
    })

    expect(cfg.isProduction).toBe(true)
    expect(cfg.isDemoMode).toBe(false)
    expect(cfg.trustProxyHops).toBe(2)
    expect(cfg.allowedOrigins).toEqual(['https://workfolio.example', 'https://preview.workfolio.example'])
    expect(cfg.allowedOrigins).not.toContain('http://localhost:3000')
  })

  it('permits reviewer demo mode in production while still rejecting short non-empty JWT secrets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const demoCfg = loadAppConfig({
      NODE_ENV: 'production',
      WORKFOLIO_DEMO_MODE: 'true',
    })
    expect(demoCfg.isProduction).toBe(true)
    expect(demoCfg.isDemoMode).toBe(true)
    expect(warnSpy).toHaveBeenCalledTimes(1)

    expect(() =>
      loadAppConfig({
        NODE_ENV: 'production',
        WORKFOLIO_DEMO_MODE: 'true',
        JWT_SECRET: 'short',
      }),
    ).toThrow(/WORKFOLIO_DEMO_MODE/i)
  })
})
