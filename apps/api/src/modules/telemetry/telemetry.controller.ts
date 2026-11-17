import { Controller, Get, Inject, MessageEvent, Sse } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Observable } from 'rxjs'
import { SkipTimeout } from '../../common/decorators/skip-timeout.decorator.js'
import { TelemetryService } from './telemetry.service.js'

@Controller('telemetry')
export class TelemetryController {
  constructor(
    @Inject(TelemetryService)
    private readonly telemetryService: TelemetryService,
  ) {}

  @SkipThrottle()
  @SkipTimeout()
  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return this.telemetryService.getEventStream()
  }

  @Get('stats')
  async getStats() {
    return this.telemetryService.getMicroserviceStats()
  }
}
