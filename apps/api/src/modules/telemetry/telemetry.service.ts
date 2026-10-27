import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, type MessageEvent, Optional } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import {
  APP_VERSION,
  type TelemetryEvent,
  type TelemetryEventType,
  type VisitorRoleType,
} from '@repo/shared-schemas';
import { type Observable, Subject, interval, map, merge } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

export const TELEMETRY_MS_CLIENT = 'TELEMETRY_MS_CLIENT';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly eventsSubject = new Subject<TelemetryEvent>();
  private readonly recentEvents: TelemetryEvent[] = [
    {
      id: randomUUID(),
      type: 'SYSTEM_HEARTBEAT',
      message: `API & SSE Engine online (v${APP_VERSION})`,
      timestamp: new Date().toISOString(),
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(TELEMETRY_MS_CLIENT) private readonly msClient?: ClientProxy,
  ) {}

  async emitEvent(input: {
    type: TelemetryEventType;
    message: string;
    actorName?: string;
    actorRole?: VisitorRoleType;
    slug?: string;
  }): Promise<TelemetryEvent> {
    const event: TelemetryEvent = {
      id: randomUUID(),
      type: input.type,
      message: input.message,
      actorName: input.actorName,
      actorRole: input.actorRole,
      slug: input.slug,
      timestamp: new Date().toISOString(),
    };

    this.recentEvents.unshift(event);
    if (this.recentEvents.length > 25) {
      this.recentEvents.pop();
    }

    this.eventsSubject.next(event);

    await this.prisma.logSystemEvent(event.type, {
      message: event.message,
      actorName: event.actorName ?? null,
      actorRole: event.actorRole ?? null,
      slug: event.slug ?? null,
    });

    if (this.msClient) {
      try {
        this.msClient.emit('telemetry.event', event).subscribe({
          error: (err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.debug(`Telemetry MS emit non-blocking note: ${msg}`);
          },
        });
      } catch {
        // Non-blocking if microservice is not connected
      }
    }

    return event;
  }

  getRecentEvents(): TelemetryEvent[] {
    return this.recentEvents;
  }

  getSseStream(): Observable<MessageEvent> {
    const liveStream$ = this.eventsSubject.asObservable().pipe(
      map(
        (event): MessageEvent => ({
          id: event.id,
          type: 'telemetry',
          data: event,
        }),
      ),
    );

    const heartbeat$ = interval(15000).pipe(
      map((): MessageEvent => {
        const heartbeat: TelemetryEvent = {
          id: randomUUID(),
          type: 'SYSTEM_HEARTBEAT',
          message: `SSE Stream Active • Build v${APP_VERSION} • Uptime ${Math.floor(process.uptime())}s`,
          timestamp: new Date().toISOString(),
        };
        return {
          id: heartbeat.id,
          type: 'telemetry',
          data: heartbeat,
        };
      }),
    );

    return merge(liveStream$, heartbeat$);
  }
}
