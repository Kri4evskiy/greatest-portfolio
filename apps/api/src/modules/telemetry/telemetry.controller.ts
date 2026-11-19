import { Controller, Get, Inject, MessageEvent, Query, Sse } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import type { PaginatedSystemEventsResponse } from '@repo/shared-schemas'
import { Observable } from 'rxjs'
import { SkipTimeout } from '../../common/decorators/skip-timeout.decorator.js'
import { type CursorPaginationQueryDto, CursorPaginationQuerySchema } from '../../common/dto/pagination-query.dto.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { TelemetryService } from './telemetry.service.js'

const CursorPaginationQueryPipe = new ZodValidationPipe(CursorPaginationQuerySchema)

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
  async getEvents(
    @Query(CursorPaginationQueryPipe) query: CursorPaginationQueryDto,
  ): Promise<PaginatedSystemEventsResponse> {
    return this.telemetryService.getSystemEvents(query)
  }
}
