import { createHash, timingSafeEqual } from 'node:crypto'
import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  type GuestPassFormInput,
  type JwtSessionPayload,
  JwtSessionPayloadSchema,
  KB_ACCESS_COOKIE_NAME,
  KB_COOKIE_MAX_AGE_MS,
  type Role,
  type SessionProfile,
  VISITOR_ROLE_LABELS,
} from '@repo/shared-schemas'
import { appConfig } from '../../config/app.config.js'
import { PrismaService } from '../../prisma/prisma.service.js'
import { TelemetryService } from '../telemetry/telemetry.service.js'

export { type JwtSessionPayload, KB_ACCESS_COOKIE_NAME, KB_COOKIE_MAX_AGE_MS }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TelemetryService) private readonly telemetry: TelemetryService,
  ) {}

  private isPasscodeMatch(candidate: string, expected: string): boolean {
    const candidateDigest = createHash('sha256').update(candidate).digest()
    const expectedDigest = createHash('sha256').update(expected).digest()
    return timingSafeEqual(candidateDigest, expectedDigest)
  }

  getGuestProfile(): SessionProfile {
    return {
      id: null,
      displayName: null,
      visitorType: null,
      role: 'GUEST',
      expiresAt: null,
    }
  }

  async issueGuestPass(
    input: GuestPassFormInput,
    userAgent?: string | undefined,
  ): Promise<{ profile: SessionProfile; accessToken: string }> {
    const providedPasscode = input.adminPasscode?.trim() ?? ''
    let assignedRole: Role = 'USER'

    if (providedPasscode.length > 0) {
      if (!this.isPasscodeMatch(providedPasscode, appConfig.adminSecretPasscode)) {
        this.logger.warn(
          `[Security] ADMIN_ESCALATION_FAILED: invalid admin passcode attempt (visitorType=${input.visitorType})`,
        )
        throw new ForbiddenException('Invalid admin passcode')
      }
      assignedRole = 'ADMIN'
    }

    const expiresAt = new Date(Date.now() + KB_COOKIE_MAX_AGE_MS)
    const session = await this.prisma.createVisitorSession({
      displayName: input.displayName,
      visitorType: input.visitorType,
      role: assignedRole,
      userAgent,
      expiresAt,
    })

    const payload: JwtSessionPayload = {
      sub: session.id,
      displayName: session.displayName,
      visitorType: session.visitorType,
      role: session.role,
      expiresAt: session.expiresAt.toISOString(),
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: '1d',
    })

    await this.telemetry.publishEvent({
      type: 'GUEST_PASS_ISSUED',
      message: `Guest Pass activated (${VISITOR_ROLE_LABELS[session.visitorType]})`,
      actorRole: session.visitorType,
    })

    return {
      profile: {
        id: session.id,
        displayName: session.displayName,
        visitorType: session.visitorType,
        role: session.role,
        expiresAt: session.expiresAt.toISOString(),
      },
      accessToken,
    }
  }

  async resolveSessionFromToken(token?: string | undefined): Promise<SessionProfile> {
    if (!token) {
      return this.getGuestProfile()
    }

    try {
      const verified: unknown = await this.jwtService.verifyAsync(token, {
        algorithms: ['HS256'],
      })
      const parsed = JwtSessionPayloadSchema.safeParse(verified)
      if (!parsed.success) {
        return this.getGuestProfile()
      }
      return {
        id: parsed.data.sub,
        displayName: parsed.data.displayName,
        visitorType: parsed.data.visitorType,
        role: parsed.data.role,
        expiresAt: parsed.data.expiresAt,
      }
    } catch {
      return this.getGuestProfile()
    }
  }
}
