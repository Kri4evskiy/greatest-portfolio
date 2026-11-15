import { type InjectionToken, Module } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller.js'
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
const throttlerParamTypes = Reflect.getMetadata('design:paramtypes', ThrottlerGuard) as unknown[] | undefined
const throttlerReflectorToken = throttlerParamTypes?.[2] as InjectionToken | undefined

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
  ],
})
export class AppModule {}
