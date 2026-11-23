import { type ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import type { Role, SessionProfile } from '@repo/shared-schemas'
import { describe, expect, it, vi } from 'vitest'
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js'
import { AuthService, KB_ACCESS_COOKIE_NAME } from '../auth.service.js'
import { ROLES_KEY } from '../decorators/roles.decorator.js'
import { JwtRolesGuard } from '../guards/jwt-roles.guard.js'

function createExecutionContext(
  cookies: Record<string, string | undefined>,
  metadata: { isPublic?: boolean; roles?: Role[] },
): { context: ExecutionContext; request: Record<string, unknown> } {
  const handler = () => undefined
  const controllerClass = class MockController {}

  Reflect.defineMetadata(IS_PUBLIC_KEY, metadata.isPublic, handler)
  Reflect.defineMetadata(ROLES_KEY, metadata.roles, handler)

  const request: Record<string, unknown> = { cookies }
  const context = {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext

  return { context, request }
}

async function createGuardWithProfile(profile: SessionProfile) {
  const resolveSessionFromToken = vi.fn(async () => profile)
  const moduleRef = await Test.createTestingModule({
    providers: [
      Reflector,
      JwtRolesGuard,
      {
        provide: AuthService,
        useValue: { resolveSessionFromToken },
      },
    ],
  }).compile()

  return {
    guard: moduleRef.get(JwtRolesGuard),
    resolveSessionFromToken,
  }
}

describe('JwtRolesGuard (RBAC enforcement & @Public bypass)', () => {
  it('bypasses authentication checks when @Public() metadata is present or no @Roles are required', async () => {
    const guestProfile: SessionProfile = {
      id: null,
      displayName: null,
      visitorType: null,
      role: 'GUEST',
      expiresAt: null,
    }
    const { guard, resolveSessionFromToken } = await createGuardWithProfile(guestProfile)

    const publicCtx = createExecutionContext({}, { isPublic: true, roles: ['ADMIN'] })
    await expect(guard.canActivate(publicCtx.context)).resolves.toBe(true)

    const openCtx = createExecutionContext({}, {})
    await expect(guard.canActivate(openCtx.context)).resolves.toBe(true)

    expect(resolveSessionFromToken).not.toHaveBeenCalled()
  })

  it('throws ForbiddenException when resolved role does not satisfy @Roles requirement', async () => {
    const userProfile: SessionProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      role: 'USER',
      expiresAt: '2026-11-30T09:00:00.000Z',
    }
    const { guard, resolveSessionFromToken } = await createGuardWithProfile(userProfile)

    const adminOnlyCtx = createExecutionContext({ [KB_ACCESS_COOKIE_NAME]: 'valid-user-jwt' }, { roles: ['ADMIN'] })
    await expect(guard.canActivate(adminOnlyCtx.context)).rejects.toThrow(ForbiddenException)
    expect(resolveSessionFromToken).toHaveBeenCalledWith('valid-user-jwt')
  })

  it('grants access and attaches resolved sessionProfile onto request when role matches', async () => {
    const userProfile: SessionProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      role: 'USER',
      expiresAt: '2026-11-30T09:00:00.000Z',
    }
    const { guard } = await createGuardWithProfile(userProfile)

    const userCtx = createExecutionContext({ [KB_ACCESS_COOKIE_NAME]: 'valid-user-jwt' }, { roles: ['USER', 'ADMIN'] })
    await expect(guard.canActivate(userCtx.context)).resolves.toBe(true)
    expect(userCtx.request.sessionProfile).toEqual(userProfile)
  })
})
