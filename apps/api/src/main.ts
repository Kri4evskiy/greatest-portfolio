import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module.js'
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter.js'

async function bootstrap(): Promise<void> {
  const logger = new Logger('NestAPI')
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const isProduction = process.env.NODE_ENV === 'production'

  // Behind Next.js rewrites or a single cloud/Nginx reverse proxy, trust exactly 1 proxy hop
  // so ThrottlerGuard reads the real client IP from X-Forwarded-For without allowing spoofing.
  if (isProduction) {
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

  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000'
  const allowedOrigins = isProduction
    ? webOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [webOrigin, 'http://127.0.0.1:3000']

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port, '0.0.0.0')
  logger.log(`NestJS API running on http://localhost:${port}/api`)
}

void bootstrap()
