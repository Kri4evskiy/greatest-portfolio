import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { loadTelemetryMsConfig } from './config/telemetry-ms.config.js'
import { TelemetryMicroserviceModule } from './telemetry.module.js'

async function bootstrap(): Promise<void> {
  const logger = new Logger('TelemetryMS')
  const { host, port } = loadTelemetryMsConfig()

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(TelemetryMicroserviceModule, {
    transport: Transport.TCP,
    options: {
      host,
      port,
    },
  })

  app.enableShutdownHooks()

  await app.listen()
  logger.log(`Telemetry Microservice listening via TCP on ${host}:${port}`)
}

bootstrap().catch((error: unknown) => {
  console.error('[TelemetryMS] Fatal startup error:', error)
  process.exit(1)
})
