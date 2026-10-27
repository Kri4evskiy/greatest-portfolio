import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TelemetryMsModule } from './telemetry-ms.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('TelemetryMS');
  const host = process.env.TELEMETRY_MS_HOST ?? '127.0.0.1';
  const port = Number.parseInt(process.env.TELEMETRY_MS_PORT ?? '4001', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(TelemetryMsModule, {
    transport: Transport.TCP,
    options: { host, port },
  });

  await app.listen();
  logger.log(`Telemetry Microservice is listening via TCP on ${host}:${port}`);
}

bootstrap();
