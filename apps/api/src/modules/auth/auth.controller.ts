import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  type GuestPassFormInput,
  GuestPassFormSchema,
  type SessionProfile,
} from '@repo/shared-schemas';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { KB_ACCESS_COOKIE } from './guards/jwt-roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest-pass')
  @HttpCode(200)
  async issueGuestPass(
    @Body(new ZodValidationPipe(GuestPassFormSchema)) body: GuestPassFormInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionProfile> {
    const userAgent = req.headers['user-agent'] ?? null;
    const { token, profile, maxAgeMs } = await this.authService.issueGuestPass(body, userAgent);

    res.cookie(KB_ACCESS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return profile;
  }

  @Get('me')
  getMe(@Req() req: Request): SessionProfile {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[
      KB_ACCESS_COOKIE
    ];
    return this.authService.resolveSessionFromCookie(token);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): SessionProfile {
    res.clearCookie(KB_ACCESS_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      id: null,
      displayName: null,
      visitorType: null,
      role: 'GUEST',
      expiresAt: null,
    };
  }
}
