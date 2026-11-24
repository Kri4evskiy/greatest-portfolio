import { Controller, Get, Inject, MessageEvent, Query, Req, Sse, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { PaginatedSystemEventsResponse, TelemetryAdminDiagnostics } from '@repo/shared-schemas'
import type { Request } from 'express'
import { Observable } from 'rxjs'
import { SkipTimeout } from '../../common/decorators/skip-timeout.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { JwtRolesGuard } from '../auth/guards/jwt-roles.guard.js'
import { type SystemEventsQuery, SystemEventsQuerySchema } from './dto/telemetry.dto.js'
import { TelemetryService } from './telemetry.service.js'

const SystemEventsQueryPipe = new ZodValidationPipe(SystemEventsQuerySchema)

@Controller('telemetry')
export class TelemetryController {
  constructor(
    @Inject(TelemetryService)
    private readonly telemetryService: TelemetryService,
  ) {}

  // Free-Tier DoS guard: limit SSE reconnect storms to 5 handshakes/min/IP
  // while keeping @SkipTimeout() so long-lived streams (up to 15m TTL) stay open.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @SkipTimeout()
  @Sse('stream')
  streamEvents(@Req() req: Request): Observable<MessageEvent> {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown'
    return this.telemetryService.getEventStream(clientIp)
  }

  @Get('stats')
  async getStats() {
    return this.telemetryService.getMicroserviceStats()
  }

  @Get('events')
  async getEvents(@Query(SystemEventsQueryPipe) query: SystemEventsQuery): Promise<PaginatedSystemEventsResponse> {
    return this.telemetryService.getSystemEvents(query)
  }

  // Dedicated ADMIN-only RBAC endpoint stub for operational diagnostics
  // (future home for Redis cache flush / moderation controls).
  @Get('admin-diagnostics')
  @UseGuards(JwtRolesGuard)
  @Roles('ADMIN')
  getAdminDiagnostics(): TelemetryAdminDiagnostics {
    return this.telemetryService.getAdminDiagnostics()
  }
}
