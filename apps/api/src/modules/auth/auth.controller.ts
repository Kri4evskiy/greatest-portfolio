import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { extractCookieString } from '../../common/utils/express-request.util.js'
import { appConfig } from '../../config/app.config.js'
import { AuthService, KB_ACCESS_COOKIE_NAME, KB_COOKIE_MAX_AGE_MS } from './auth.service.js'
import { type GuestPassFormInput, GuestPassFormSchema, type SessionProfile } from './dto/auth.dto.js'

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
      secure: appConfig.isProduction && !appConfig.isDemoMode,
      sameSite: 'lax',
      path: '/',
      maxAge: KB_COOKIE_MAX_AGE_MS,
    })

    return profile
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(GuestPassFormSchema)) body: GuestPassFormInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionProfile> {
    return this.issueGuestPass(body, req, res)
  }

  @Get('me')
  async getMe(@Req() req: Request): Promise<SessionProfile> {
    const token = extractCookieString(req, KB_ACCESS_COOKIE_NAME)
    return this.authService.resolveSessionFromToken(token)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): SessionProfile {
    res.clearCookie(KB_ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: appConfig.isProduction && !appConfig.isDemoMode,
      sameSite: 'lax',
      path: '/',
    })
    return this.authService.getGuestProfile()
  }
}
