import { DEFAULT_DEV_JWT_SECRET } from '@repo/shared-schemas'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyEdgeJwtHs256 } from '../edge-jwt'

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

async function signHs256Jwt(
  payload: Record<string, unknown>,
  secret: string,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' },
): Promise<string> {
  const encoder = new TextEncoder()
  const encodedHeader = toBase64Url(encoder.encode(JSON.stringify(header)))
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput))
  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('verifyEdgeJwtHs256 (Edge Web Crypto JWT guard)', () => {
  it('accepts a valid non-expired HS256 token signed with DEFAULT_DEV_JWT_SECRET or custom JWT_SECRET', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const defaultToken = await signHs256Jwt({ sub: 'user-1', role: 'USER', exp: futureExp }, DEFAULT_DEV_JWT_SECRET)
    await expect(verifyEdgeJwtHs256(defaultToken)).resolves.toBe(true)

    const rotatedSecret = 'rotated-production-edge-jwt-secret-key-2026'
    vi.stubEnv('JWT_SECRET', rotatedSecret)
    const rotatedToken = await signHs256Jwt({ sub: 'admin-1', role: 'ADMIN', exp: futureExp }, rotatedSecret)
    await expect(verifyEdgeJwtHs256(rotatedToken)).resolves.toBe(true)

    // Old default-secret token must be rejected once JWT_SECRET rotates
    await expect(verifyEdgeJwtHs256(defaultToken)).resolves.toBe(false)
  })

  it('rejects expired tokens, missing exp claims, and non-HS256 alg downgrade attempts', async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60
    const futureExp = Math.floor(Date.now() / 1000) + 3600

    const expired = await signHs256Jwt({ sub: 'user-1', exp: pastExp }, DEFAULT_DEV_JWT_SECRET)
    const missingExp = await signHs256Jwt({ sub: 'user-1', role: 'USER' }, DEFAULT_DEV_JWT_SECRET)
    const algNone = await signHs256Jwt({ sub: 'user-1', exp: futureExp }, DEFAULT_DEV_JWT_SECRET, {
      alg: 'none',
      typ: 'JWT',
    })
    const algRs256 = await signHs256Jwt({ sub: 'user-1', exp: futureExp }, DEFAULT_DEV_JWT_SECRET, {
      alg: 'RS256',
      typ: 'JWT',
    })

    await expect(verifyEdgeJwtHs256(expired)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(missingExp)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(algNone)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(algRs256)).resolves.toBe(false)
  })

  it('rejects tampered payloads, wrong signatures, and malformed token strings', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const valid = await signHs256Jwt({ sub: 'user-1', role: 'USER', exp: futureExp }, DEFAULT_DEV_JWT_SECRET)
    const [header, , sig] = valid.split('.')
    const tamperedPayload = toBase64Url(
      new TextEncoder().encode(JSON.stringify({ sub: 'user-1', role: 'ADMIN', exp: futureExp })),
    )
    const wrongSecret = await signHs256Jwt({ sub: 'user-1', exp: futureExp }, 'attacker-forged-secret')

    await expect(verifyEdgeJwtHs256(`${header}.${tamperedPayload}.${sig}`)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(wrongSecret)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(undefined)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256('')).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256('only.two')).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256('invalid!.base64!.chars!')).resolves.toBe(false)
  })

  it('rejects GUEST role, missing sub, future nbf, and fails closed in production without a strong non-default JWT_SECRET', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const futureNbf = Math.floor(Date.now() / 1000) + 300

    const guestRoleToken = await signHs256Jwt({ sub: 'user-1', role: 'GUEST', exp: futureExp }, DEFAULT_DEV_JWT_SECRET)
    const missingSubToken = await signHs256Jwt({ role: 'USER', exp: futureExp }, DEFAULT_DEV_JWT_SECRET)
    const futureNbfToken = await signHs256Jwt(
      { sub: 'user-1', role: 'USER', nbf: futureNbf, exp: futureExp },
      DEFAULT_DEV_JWT_SECRET,
    )

    await expect(verifyEdgeJwtHs256(guestRoleToken)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(missingSubToken)).resolves.toBe(false)
    await expect(verifyEdgeJwtHs256(futureNbfToken)).resolves.toBe(false)

    // Fail-closed in NODE_ENV=production when JWT_SECRET is missing or default dev secret
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('WORKFOLIO_DEMO_MODE', 'false')
    vi.stubEnv('JWT_SECRET', '')

    const defaultToken = await signHs256Jwt({ sub: 'user-1', role: 'USER', exp: futureExp }, DEFAULT_DEV_JWT_SECRET)
    await expect(verifyEdgeJwtHs256(defaultToken)).resolves.toBe(false)
    expect(errorSpy).toHaveBeenCalled()

    // Explicit WORKFOLIO_DEMO_MODE=true permits local Docker reviewer demo with default secret
    vi.stubEnv('WORKFOLIO_DEMO_MODE', 'true')
    await expect(verifyEdgeJwtHs256(defaultToken)).resolves.toBe(true)

    // Strong non-default secret passes in strict production
    vi.stubEnv('WORKFOLIO_DEMO_MODE', 'false')
    const prodSecret = 'prod-strong-edge-jwt-secret-key-2026-min-32-chars'
    vi.stubEnv('JWT_SECRET', prodSecret)
    const prodToken = await signHs256Jwt({ sub: 'admin-1', role: 'ADMIN', exp: futureExp }, prodSecret)
    await expect(verifyEdgeJwtHs256(prodToken)).resolves.toBe(true)

    errorSpy.mockRestore()
  })
})
