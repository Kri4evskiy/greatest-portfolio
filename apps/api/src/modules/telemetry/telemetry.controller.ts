import { Controller, Get, type MessageEvent, Sse } from '@nestjs/common';
import type { TelemetryEvent } from '@repo/shared-schemas';
import type { Observable } from 'rxjs';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('recent')
  getRecent(): { events: TelemetryEvent[] } {
    return {
      events: this.telemetryService.getRecentEvents(),
    };
  }

  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return this.telemetryService.getSseStream();
  }
}
