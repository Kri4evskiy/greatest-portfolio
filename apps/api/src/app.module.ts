import {
  type ExecutionContext,
  type InjectionToken,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller.js'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor.js'
import { CsrfOriginMiddleware } from './common/middleware/csrf-origin.middleware.js'
import { LoggingMiddleware } from './common/middleware/logging.middleware.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { KnowledgeModule } from './modules/knowledge/knowledge.module.js'
import { TelemetryModule } from './modules/telemetry/telemetry.module.js'
import { PrismaModule } from './prisma/prisma.module.js'

// NOTE / TODO (Dependency Maintenance):
// @nestjs/core@12.x ships as native ESM ("type": "module"), whereas @nestjs/throttler@6.7.1
// is still published as CommonJS. Under `tsx` dev server, require('@nestjs/core') inside
// @nestjs/throttler resolves a separate Reflector class reference from ESM `import { Reflector }`.
// Bridging the extracted metadata token to NestJS's active Reflector resolves the dual-package
// hazard across both `tsx` and compiled `dist`.
// -> Periodically check `@nestjs/throttler` updates: once it ships native ESM ("type": "module"),
//    this bridge can be safely removed, leaving only `APP_GUARD: ThrottlerGuard`.

const SHARED_AUTH_THROTTLE_HANDLERS = new Set(['issueGuestPass', 'login'])
const throttlerParamTypes = Reflect.getMetadata('design:paramtypes', ThrottlerGuard) as unknown[] | undefined
const throttlerReflectorToken = throttlerParamTypes?.[2] as InjectionToken | undefined

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
      // Share a single rate-limit bucket across /api/auth/guest-pass and its /api/auth/login alias
      // so attackers cannot double brute-force attempts across both endpoints.
      generateKey: (context: ExecutionContext, trackerString: string, throttlerName: string): string => {
        const className = context.getClass().name
        const handlerName = context.getHandler().name
        if (className === 'AuthController' && SHARED_AUTH_THROTTLE_HANDLERS.has(handlerName)) {
          return `AuthController:issuePass:${trackerString}:${throttlerName}`
        }
        return `${className}:${handlerName}:${trackerString}:${throttlerName}`
      },
    }),
    PrismaModule,
    TelemetryModule,
    AuthModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
  providers: [
    Reflector,
    ...(throttlerReflectorToken && throttlerReflectorToken !== Reflector
      ? [{ provide: throttlerReflectorToken, useExisting: Reflector }]
      : []),
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggingMiddleware, CsrfOriginMiddleware).forRoutes('{*path}')
  }
}
