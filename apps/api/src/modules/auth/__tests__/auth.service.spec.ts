import { JwtModule } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { describe, expect, it, vi } from 'vitest'
import { appConfig } from '../../../config/app.config.js'
import { PrismaService } from '../../../prisma/prisma.service.js'
import { TelemetryService } from '../../telemetry/telemetry.service.js'
import { AuthService } from '../auth.service.js'

function createTestingModule(overrides?: {
  createVisitorSession?: ReturnType<typeof vi.fn>
  publishEvent?: ReturnType<typeof vi.fn>
}) {
  const createVisitorSession =
    overrides?.createVisitorSession ??
    vi.fn(async (data: { displayName: string; visitorType: string; role: string; expiresAt: Date }) => ({
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayName: data.displayName,
      visitorType: data.visitorType,
      role: data.role,
      userAgent: null,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
    }))

  const publishEvent = overrides?.publishEvent ?? vi.fn(async () => undefined)

  return Test.createTestingModule({
    imports: [
      JwtModule.register({
        secret: appConfig.jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
    ],
    providers: [
      AuthService,
      {
        provide: PrismaService,
        useValue: { createVisitorSession },
      },
      {
        provide: TelemetryService,
        useValue: { publishEvent },
      },
    ],
  }).compile()
}

describe('AuthService (NestJS DI + timing-safe passcode + JWT session)', () => {
  it('returns default GUEST profile when no token or invalid token is provided', async () => {
    const moduleRef = await createTestingModule()
    const authService = moduleRef.get(AuthService)

    expect(authService.getGuestProfile()).toEqual({
      id: null,
      displayName: null,
      visitorType: null,
      role: 'GUEST',
      expiresAt: null,
    })

    await expect(authService.resolveSessionFromToken(undefined)).resolves.toMatchObject({ role: 'GUEST', id: null })
    await expect(authService.resolveSessionFromToken('invalid.jwt.token')).resolves.toMatchObject({
      role: 'GUEST',
      id: null,
    })
  })

  it('issues USER pass on empty or mismatched passcode without throwing on different lengths', async () => {
    const publishEvent = vi.fn(async () => undefined)
    const moduleRef = await createTestingModule({ publishEvent })
    const authService = moduleRef.get(AuthService)

    const { profile, accessToken } = await authService.issueGuestPass({
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      adminPasscode: 'wrong-len',
    })

    expect(profile.role).toBe('USER')
    expect(accessToken.split('.')).toHaveLength(3)
    expect(publishEvent).toHaveBeenCalledWith({
      type: 'GUEST_PASS_ISSUED',
      message: 'Guest Pass activated (Team Lead / Tech Lead)',
      actorRole: 'TEAM_LEAD',
    })

    const resolved = await authService.resolveSessionFromToken(accessToken)
    expect(resolved).toEqual(profile)
  })

  it('elevates role to ADMIN via timing-safe SHA-256 comparison when adminPasscode matches', async () => {
    const moduleRef = await createTestingModule()
    const authService = moduleRef.get(AuthService)

    const { profile, accessToken } = await authService.issueGuestPass({
      displayName: 'Stanislav • Owner',
      visitorType: 'FOUNDER',
      adminPasscode: appConfig.adminSecretPasscode,
    })

    expect(profile.role).toBe('ADMIN')
    const resolved = await authService.resolveSessionFromToken(accessToken)
    expect(resolved.role).toBe('ADMIN')
    expect(resolved.displayName).toBe('Stanislav • Owner')
  })
})
