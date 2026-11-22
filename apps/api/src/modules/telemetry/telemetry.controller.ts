import { Controller, Get, Inject, MessageEvent, Query, Sse } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import type { PaginatedSystemEventsResponse } from '@repo/shared-schemas'
import { Observable } from 'rxjs'
import { SkipTimeout } from '../../common/decorators/skip-timeout.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { type SystemEventsQuery, SystemEventsQuerySchema } from './dto/telemetry.dto.js'
import { TelemetryService } from './telemetry.service.js'

const SystemEventsQueryPipe = new ZodValidationPipe(SystemEventsQuerySchema)

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

  @Get('events')
  async getEvents(@Query(SystemEventsQueryPipe) query: SystemEventsQuery): Promise<PaginatedSystemEventsResponse> {
    return this.telemetryService.getSystemEvents(query)
  }
}
