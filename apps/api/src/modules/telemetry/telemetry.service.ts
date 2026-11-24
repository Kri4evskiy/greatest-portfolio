import { randomUUID } from 'node:crypto'
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  MessageEvent,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
  type PaginatedSystemEventsResponse,
  type SystemEventsQuery,
  type TelemetryAdminDiagnostics,
  TelemetryAdminDiagnosticsSchema,
  type TelemetryEvent,
  TelemetryEventSchema,
  type TelemetryEventType,
  type TelemetryStatsResponse,
  type VisitorRoleType,
} from '@repo/shared-schemas'
import {
  finalize,
  firstValueFrom,
  interval,
  map,
  merge,
  Observable,
  of,
  Subject,
  takeUntil,
  timeout,
  timer,
} from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service.js'

export const TELEMETRY_MS_CLIENT = 'TELEMETRY_MS_CLIENT'

// Strict Free-Tier SSE capacity bounds (prevents FD exhaustion and Render/Koyeb memory spikes)
export const MAX_SSE_STREAMS_GLOBAL = 50
export const MAX_SSE_STREAMS_PER_IP = 2
export const MAX_SSE_STREAM_LIFETIME_MS = 15 * 60 * 1000 // 15 minutes

@Injectable()
export class TelemetryService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name)
  private readonly events$ = new Subject<TelemetryEvent>()
  private readonly shutdown$ = new Subject<void>()
  private readonly recentEvents: TelemetryEvent[] = []
  private localEventsCounter = 0

  private activeSseStreamsGlobal = 0
  private readonly activeSseStreamsByIp = new Map<string, number>()

  constructor(
    @Inject(TELEMETRY_MS_CLIENT) private readonly telemetryClient: ClientProxy,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async onModuleDestroy(): Promise<void> {
    this.shutdown$.next()
    this.shutdown$.complete()
    this.events$.complete()
    this.activeSseStreamsGlobal = 0
    this.activeSseStreamsByIp.clear()
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

    this.localEventsCounter += 1
    this.recentEvents.unshift(rawEvent)
    if (this.recentEvents.length > 25) {
      this.recentEvents.pop()
    }

    this.events$.next(rawEvent)
    await this.prisma.logSystemEvent(rawEvent.type, rawEvent)

    // ClientProxy.emit() returns a hot Observable whose TCP ECONNREFUSED failures happen
    // asynchronously — subscribing with an error handler prevents unhandled RxJS exceptions
    // when telemetry-ms is offline in local/fallback mode.
    this.telemetryClient
      .emit('telemetry.event', rawEvent)
      .pipe(takeUntil(this.shutdown$))
      .subscribe({
        error: (err: unknown) => {
          this.logger.debug(`Telemetry MS emit skipped (local mode): ${String(err)}`)
        },
      })

    return rawEvent
  }

  async getSystemEvents(query: SystemEventsQuery): Promise<PaginatedSystemEventsResponse> {
    return this.prisma.getCursorPaginatedSystemEvents(query)
  }

  async checkMicroserviceConnected(): Promise<boolean> {
    const stats = await this.getMicroserviceStats()
    return stats.microserviceConnected
  }

  async getMicroserviceStats(): Promise<TelemetryStatsResponse> {
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
        totalEventsProcessed: this.localEventsCounter,
        recentEvents: this.recentEvents.slice(0, 5),
        microserviceConnected: false,
      }
    }
  }

  getAdminDiagnostics(): TelemetryAdminDiagnostics {
    const memoryStats = this.prisma.getMemoryStoreStats()
    return TelemetryAdminDiagnosticsSchema.parse({
      status: 'ok',
      activeSseStreams: this.activeSseStreamsGlobal,
      maxSseStreamsGlobal: MAX_SSE_STREAMS_GLOBAL,
      maxSseStreamsPerIp: MAX_SSE_STREAMS_PER_IP,
      trackedSessionsInMemory: memoryStats.sessions,
      trackedMetricsInMemory: memoryStats.metrics,
      totalEventsProcessed: this.localEventsCounter,
      databaseConnected: this.prisma.isDatabaseConnected(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  }

  private acquireSseSlot(clientIp: string): void {
    if (this.activeSseStreamsGlobal >= MAX_SSE_STREAMS_GLOBAL) {
      throw new ServiceUnavailableException('SSE telemetry stream capacity reached. Retry shortly.')
    }

    const currentForIp = this.activeSseStreamsByIp.get(clientIp) ?? 0
    if (currentForIp >= MAX_SSE_STREAMS_PER_IP) {
      throw new HttpException(
        `Too many concurrent SSE streams from this IP (max ${MAX_SSE_STREAMS_PER_IP}).`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    this.activeSseStreamsGlobal += 1
    this.activeSseStreamsByIp.set(clientIp, currentForIp + 1)
  }

  private releaseSseSlot(clientIp: string): void {
    this.activeSseStreamsGlobal = Math.max(0, this.activeSseStreamsGlobal - 1)
    const currentForIp = this.activeSseStreamsByIp.get(clientIp) ?? 0
    if (currentForIp <= 1) {
      this.activeSseStreamsByIp.delete(clientIp)
    } else {
      this.activeSseStreamsByIp.set(clientIp, currentForIp - 1)
    }
  }

  getEventStream(clientIp = 'unknown'): Observable<MessageEvent> {
    this.acquireSseSlot(clientIp)

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
      takeUntil(timer(MAX_SSE_STREAM_LIFETIME_MS)),
      finalize(() => {
        this.releaseSseSlot(clientIp)
      }),
      map((event) => ({
        id: event.id,
        type: 'message',
        data: event,
      })),
    )
  }
}
