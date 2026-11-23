import { Test } from '@nestjs/testing'
import { KB_ACCESS_COOKIE_NAME, KB_COOKIE_MAX_AGE_MS, type SessionProfile } from '@repo/shared-schemas'
import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { AuthController } from '../auth.controller.js'
import { AuthService } from '../auth.service.js'

describe('AuthController (HttpOnly cookie attributes & logout)', () => {
  it('sets HttpOnly, SameSite=Lax cookie on guest-pass and clears it on logout', async () => {
    const expectedProfile: SessionProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      role: 'USER',
      expiresAt: '2026-11-30T09:00:00.000Z',
    }
    const guestProfile: SessionProfile = {
      id: null,
      displayName: null,
      visitorType: null,
      role: 'GUEST',
      expiresAt: null,
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            issueGuestPass: vi.fn(async () => ({
              profile: expectedProfile,
              accessToken: 'signed-jwt-token',
            })),
            getGuestProfile: vi.fn(() => guestProfile),
            resolveSessionFromToken: vi.fn(async () => guestProfile),
          },
        },
      ],
    }).compile()

    const controller = moduleRef.get(AuthController)
    const cookieSpy = vi.fn()
    const clearCookieSpy = vi.fn()

    const mockReq = {
      headers: { 'user-agent': 'Vitest' },
      cookies: {},
    } as unknown as Request

    const mockRes = {
      cookie: cookieSpy,
      clearCookie: clearCookieSpy,
    } as unknown as Response

    const issued = await controller.issueGuestPass(
      { displayName: 'Alex • Team Lead', visitorType: 'TEAM_LEAD' },
      mockReq,
      mockRes,
    )

    expect(issued).toEqual(expectedProfile)
    expect(cookieSpy).toHaveBeenCalledWith(KB_ACCESS_COOKIE_NAME, 'signed-jwt-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: KB_COOKIE_MAX_AGE_MS,
    })

    const loggedOut = controller.logout(mockRes)
    expect(loggedOut).toEqual(guestProfile)
    expect(clearCookieSpy).toHaveBeenCalledWith(KB_ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    })
  })
})
