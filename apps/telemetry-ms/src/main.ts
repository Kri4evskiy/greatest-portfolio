import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { TelemetryMicroserviceModule } from './telemetry.module.js'

async function bootstrap(): Promise<void> {
  const logger = new Logger('TelemetryMS')
  const host = process.env.TELEMETRY_MS_HOST ?? '0.0.0.0'
  const port = Number(process.env.TELEMETRY_MS_PORT ?? 4001)

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(TelemetryMicroserviceModule, {
    transport: Transport.TCP,
    options: {
      host,
      port,
    },
  })

  await app.listen()
  logger.log(`Telemetry Microservice listening via TCP on ${host}:${port}`)
}

void bootstrap()

// verify turbo --affected
