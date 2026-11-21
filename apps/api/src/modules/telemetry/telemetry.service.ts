import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Logger, MessageEvent, OnModuleDestroy } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
  type PaginatedSystemEventsResponse,
  type TelemetryEvent,
  TelemetryEventSchema,
  type TelemetryEventType,
  type VisitorRoleType,
} from '@repo/shared-schemas'
import { firstValueFrom, interval, map, merge, Observable, of, Subject, takeUntil, timeout } from 'rxjs'
import type { CursorPaginationQueryDto } from '../../common/dto/pagination-query.dto.js'
import { PrismaService } from '../../prisma/prisma.service.js'

export const TELEMETRY_MS_CLIENT = 'TELEMETRY_MS_CLIENT'

@Injectable()
export class TelemetryService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name)
  private readonly events$ = new Subject<TelemetryEvent>()
  private readonly shutdown$ = new Subject<void>()
  private readonly recentEvents: TelemetryEvent[] = []

  constructor(
    @Inject(TELEMETRY_MS_CLIENT) private readonly telemetryClient: ClientProxy,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async onModuleDestroy(): Promise<void> {
    this.shutdown$.next()
    this.shutdown$.complete()
    this.events$.complete()
    try {
      await this.telemetryClient.close()
    } catch {
      // Ignore TCP close errors on shutdown
    }
  }

  async publishEvent(input: {
    type: TelemetryEventType
    message: string
    actorRole?: VisitorRoleType | undefined
    slug?: string | undefined
  }): Promise<TelemetryEvent> {
    const rawEvent: TelemetryEvent = TelemetryEventSchema.parse({
      id: randomUUID(),
      type: input.type,
      message: input.message,
      ...(input.actorRole ? { actorRole: input.actorRole } : {}),
      ...(input.slug ? { slug: input.slug } : {}),
      timestamp: new Date().toISOString(),
    })

    this.recentEvents.unshift(rawEvent)
    if (this.recentEvents.length > 25) {
      this.recentEvents.pop()
    }

    this.events$.next(rawEvent)
    await this.prisma.logSystemEvent(rawEvent.type, rawEvent)

    try {
      this.telemetryClient.emit('telemetry.event', rawEvent)
    } catch (err) {
      this.logger.debug(`Telemetry MS emit skipped (local mode): ${String(err)}`)
    }

    return rawEvent
  }

  async getSystemEvents(query: CursorPaginationQueryDto): Promise<PaginatedSystemEventsResponse> {
    return this.prisma.getCursorPaginatedSystemEvents(query)
  }

  async getMicroserviceStats(): Promise<{
    totalEventsProcessed: number
    recentEvents: TelemetryEvent[]
    microserviceConnected: boolean
  }> {
    try {
      const response = await firstValueFrom(
        this.telemetryClient
          .send<{
            totalEventsProcessed: number
            recentEvents: TelemetryEvent[]
          }>('telemetry.stats', {})
          .pipe(timeout(800)),
      )
      return {
        ...response,
        microserviceConnected: true,
      }
    } catch {
      return {
        totalEventsProcessed: this.recentEvents.length,
        recentEvents: this.recentEvents.slice(0, 5),
        microserviceConnected: false,
      }
    }
  }

  getEventStream(): Observable<MessageEvent> {
    const welcomeEvent: TelemetryEvent = {
      id: randomUUID(),
      type: 'SYSTEM_HEARTBEAT',
      message: 'SSE Telemetry Stream connected (NestJS + Microservice)',
      timestamp: new Date().toISOString(),
    }

    const heartbeat$ = interval(15000).pipe(
      map(
        (): TelemetryEvent => ({
          id: randomUUID(),
          type: 'SYSTEM_HEARTBEAT',
          message: `System pulse OK | Uptime ${Math.floor(process.uptime())}s`,
          timestamp: new Date().toISOString(),
        }),
      ),
    )

    return merge(of(welcomeEvent), this.events$.asObservable(), heartbeat$).pipe(
      takeUntil(this.shutdown$),
      map((event) => ({
        id: event.id,
        type: 'message',
        data: event,
      })),
    )
  }
}
