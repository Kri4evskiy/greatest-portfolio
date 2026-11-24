import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module.js'
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter.js'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js'
import { appConfig } from './config/app.config.js'

async function bootstrap(): Promise<void> {
  const logger = new Logger('NestAPI')
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  app.useBodyParser('json', { limit: '100kb' })

  // Configure exact reverse-proxy hop count from validated env (TRUST_PROXY_HOPS, default 1)
  // so ThrottlerGuard extracts the real client IP from X-Forwarded-For without IP spoofing
  // or shared-proxy bucket collisions across topologies (Render/Koyeb = 1, Nginx + Next.js rewrite = 2).
  if (appConfig.isProduction && appConfig.trustProxyHops > 0) {
    app.set('trust proxy', appConfig.trustProxyHops)
  }

  app.setGlobalPrefix('api')
  app.use(
    helmet({
      // Cross-origin CORP permits intentional cross-domain Vercel -> Render API fetches
      // governed by strict CORS allowedOrigins, while strict CSP blocks active rendering of API responses.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  )
  app.use(cookieParser())
  app.useGlobalFilters(new SentryExceptionFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())

  app.enableCors({
    origin: appConfig.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['X-Request-Id'],
  })

  app.enableShutdownHooks()

  await app.listen(appConfig.port, '0.0.0.0')
  logger.log(`NestJS API running on http://localhost:${appConfig.port}/api`)
}

bootstrap().catch((error: unknown) => {
  console.error('[NestAPI] Fatal startup error:', error)
  process.exit(1)
})
