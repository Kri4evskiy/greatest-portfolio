import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role, VisitorRoleType } from '@repo/shared-schemas';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

export const KB_ACCESS_COOKIE = 'kb_access_token';

export interface JwtTokenPayload {
  sub: string;
  displayName: string;
  visitorType: VisitorRoleType;
  role: Role;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtTokenPayload;
}

@Injectable()
export class JwtRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (request.cookies as Record<string, string | undefined> | undefined)?.[
      KB_ACCESS_COOKIE
    ];

    if (!token) {
      if (requiredRoles.includes('GUEST')) {
        return true;
      }
      throw new ForbiddenException(
        'Guest Pass required. Unlock Base of Knowledge via the 1-click header modal.',
      );
    }

    try {
      const payload = this.jwtService.verify<JwtTokenPayload>(token);
      request.user = payload;

      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException(`Insufficient role (${payload.role}).`);
      }
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid or expired kb_access_token cookie.');
    }
  }
}
