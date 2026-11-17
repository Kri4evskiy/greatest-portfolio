import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { appConfig } from '../../config/app.config.js'
import { TelemetryController } from './telemetry.controller.js'
import { TELEMETRY_MS_CLIENT, TelemetryService } from './telemetry.service.js'

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: TELEMETRY_MS_CLIENT,
        transport: Transport.TCP,
        options: {
          host: appConfig.telemetryMsHost,
          port: appConfig.telemetryMsPort,
        },
      },
    ]),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
