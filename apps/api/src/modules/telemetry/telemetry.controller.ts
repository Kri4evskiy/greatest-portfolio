import { Controller, Get, Inject, MessageEvent, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { TelemetryService } from './telemetry.service.js'

@Controller('telemetry')
export class TelemetryController {
  constructor(
    @Inject(TelemetryService)
    private readonly telemetryService: TelemetryService,
  ) {}

  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return this.telemetryService.getEventStream()
  }

  @Get('stats')
  async getStats() {
    return this.telemetryService.getMicroserviceStats()
  }
}
