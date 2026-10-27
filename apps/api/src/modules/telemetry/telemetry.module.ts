import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TelemetryController } from './telemetry.controller';
import { TELEMETRY_MS_CLIENT, TelemetryService } from './telemetry.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: TELEMETRY_MS_CLIENT,
        transport: Transport.TCP,
        options: {
          host: process.env.TELEMETRY_MS_HOST ?? '127.0.0.1',
          port: Number.parseInt(process.env.TELEMETRY_MS_PORT ?? '4001', 10),
        },
      },
    ]),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
