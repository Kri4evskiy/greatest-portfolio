import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { appConfig } from '../../config/app.config.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtRolesGuard } from './guards/jwt-roles.guard.js'

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: appConfig.jwtSecret,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '1d',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtRolesGuard],
  exports: [AuthService, JwtRolesGuard],
})
export class AuthModule {}
