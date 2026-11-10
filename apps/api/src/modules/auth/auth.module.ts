import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { resolveJwtSecret } from '@repo/shared-schemas'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtRolesGuard } from './jwt-roles.guard.js'

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: resolveJwtSecret(process.env.JWT_SECRET),
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
