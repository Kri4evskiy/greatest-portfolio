import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  type GuestPassFormInput,
  type Role,
  type SessionProfile,
  VISITOR_ROLE_LABELS,
  type VisitorRoleType,
} from '@repo/shared-schemas'
import { PrismaService } from '../../prisma/prisma.service.js'
import { TelemetryService } from '../telemetry/telemetry.service.js'

export const KB_ACCESS_COOKIE_NAME = 'kb_access_token'
export const KB_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export interface JwtSessionPayload {
  sub: string
  displayName: string
  visitorType: VisitorRoleType
  role: Role
  expiresAt: string
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TelemetryService) private readonly telemetry: TelemetryService,
  ) {}

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
    const expectedAdminPasscode = process.env.ADMIN_SECRET_PASSCODE ?? 'workfolio-admin-2026'
    const isAdmin = Boolean(input.adminPasscode) && input.adminPasscode === expectedAdminPasscode
    const assignedRole: Role = isAdmin ? 'ADMIN' : 'USER'

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

    const accessToken = await this.jwtService.signAsync(payload)

    await this.telemetry.publishEvent({
      type: 'GUEST_PASS_ISSUED',
      message: `${session.displayName} (${VISITOR_ROLE_LABELS[session.visitorType]}) unlocked Knowledge Base as ${session.role}`,
      actorName: session.displayName,
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
      const verified = await this.jwtService.verifyAsync<JwtSessionPayload>(token)
      return {
        id: verified.sub,
        displayName: verified.displayName,
        visitorType: verified.visitorType,
        role: verified.role,
        expiresAt: verified.expiresAt,
      }
    } catch {
      return this.getGuestProfile()
    }
  }
}
