import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  type GuestPassFormInput,
  type Role,
  type SessionProfile,
  VISITOR_ROLE_LABELS,
} from '@repo/shared-schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import type { JwtTokenPayload } from './guards/jwt-roles.guard';

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly telemetry: TelemetryService,
  ) {}

  async issueGuestPass(
    input: GuestPassFormInput,
    userAgent: string | null,
  ): Promise<{ token: string; profile: SessionProfile; maxAgeMs: number }> {
    const expectedAdminSecret = process.env.ADMIN_SECRET_PASSCODE ?? 'workfolio-admin-2026';
    const isAdmin =
      typeof input.adminPasscode === 'string' &&
      input.adminPasscode.length > 0 &&
      input.adminPasscode === expectedAdminSecret;

    const assignedRole: Role = isAdmin ? 'ADMIN' : 'USER';
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

    const session = await this.prisma.createVisitorSession({
      displayName: input.displayName,
      visitorType: input.visitorType,
      role: assignedRole,
      userAgent,
      expiresAt,
    });

    const payload: JwtTokenPayload = {
      sub: session.id,
      displayName: session.displayName,
      visitorType: session.visitorType,
      role: session.role,
    };

    const token = await this.jwtService.signAsync(payload);

    await this.telemetry.emitEvent({
      type: 'GUEST_PASS_ISSUED',
      message: `${session.displayName} (${VISITOR_ROLE_LABELS[session.visitorType]}) unlocked Base of Knowledge as ${session.role}`,
      actorName: session.displayName,
      actorRole: session.visitorType,
    });

    return {
      token,
      maxAgeMs: SEVEN_DAYS_MS,
      profile: {
        id: session.id,
        displayName: session.displayName,
        visitorType: session.visitorType,
        role: session.role,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }

  resolveSessionFromCookie(token: string | undefined): SessionProfile {
    if (!token) {
      return {
        id: null,
        displayName: null,
        visitorType: null,
        role: 'GUEST',
        expiresAt: null,
      };
    }

    try {
      const payload = this.jwtService.verify<JwtTokenPayload>(token);
      return {
        id: payload.sub,
        displayName: payload.displayName,
        visitorType: payload.visitorType,
        role: payload.role,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      };
    } catch {
      return {
        id: null,
        displayName: null,
        visitorType: null,
        role: 'GUEST',
        expiresAt: null,
      };
    }
  }
}
