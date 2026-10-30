import { Module } from '@nestjs/common'
import { TelemetryMicroserviceController } from './telemetry.controller.js'

@Module({
  controllers: [TelemetryMicroserviceController],
})
export class TelemetryMicroserviceModule {}
