import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role } from '@repo/shared-schemas'
import type { Request } from 'express'
import { AuthService, KB_ACCESS_COOKIE_NAME } from './auth.service.js'
import { ROLES_KEY } from './roles.decorator.js'

@Injectable()
export class JwtRolesGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const token = request.cookies?.[KB_ACCESS_COOKIE_NAME] as string | undefined
    const profile = await this.authService.resolveSessionFromToken(token)

    if (!requiredRoles.includes(profile.role)) {
      throw new ForbiddenException({
        message: 'Protected Knowledge Base resource. Issue a 1-click Guest Pass first.',
        currentRole: profile.role,
        requiredRoles,
      })
    }

    ;(request as Request & { sessionProfile?: unknown }).sessionProfile = profile
    return true
  }
}
