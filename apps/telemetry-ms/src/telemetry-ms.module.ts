import { Module } from '@nestjs/common';
import { TelemetryMsController } from './telemetry-ms.controller';

@Module({
  controllers: [TelemetryMsController],
})
export class TelemetryMsModule {}
