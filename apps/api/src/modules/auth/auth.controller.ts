import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common'
import {
  type GuestPassFormInput,
  GuestPassFormSchema,
  type SessionProfile,
} from '@repo/shared-schemas'
import type { Request, Response } from 'express'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { AuthService, KB_ACCESS_COOKIE_NAME, KB_COOKIE_MAX_AGE_MS } from './auth.service.js'

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('guest-pass')
  @HttpCode(HttpStatus.OK)
  async issueGuestPass(
    @Body(new ZodValidationPipe(GuestPassFormSchema)) body: GuestPassFormInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionProfile> {
    const userAgent = req.headers['user-agent']
    const { profile, accessToken } = await this.authService.issueGuestPass(body, userAgent)

    res.cookie(KB_ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: KB_COOKIE_MAX_AGE_MS,
    })

    return profile
  }

  @Get('me')
  async getMe(@Req() req: Request): Promise<SessionProfile> {
    const token = req.cookies?.[KB_ACCESS_COOKIE_NAME] as string | undefined
    return this.authService.resolveSessionFromToken(token)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): SessionProfile {
    res.clearCookie(KB_ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    return this.authService.getGuestProfile()
  }
}
