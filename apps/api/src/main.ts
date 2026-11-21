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
  app.useBodyParser('urlencoded', { limit: '100kb', extended: true })

  // Behind Next.js rewrites or a single cloud/Nginx reverse proxy, trust exactly 1 proxy hop
  // so ThrottlerGuard reads the real client IP from X-Forwarded-For without allowing spoofing.
  if (appConfig.isProduction) {
    app.set('trust proxy', 1)
  }

  app.setGlobalPrefix('api')
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
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

void bootstrap()
