import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtRolesGuard } from './jwt-roles.guard.js'

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'workfolio-super-secret-jwt-key-2026',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtRolesGuard],
  exports: [AuthService, JwtRolesGuard],
})
export class AuthModule {}
