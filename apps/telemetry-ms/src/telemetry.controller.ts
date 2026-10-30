import { Controller, Logger } from '@nestjs/common'
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices'
import { TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas'

@Controller()
export class TelemetryMicroserviceController {
  private readonly logger = new Logger(TelemetryMicroserviceController.name)
  private totalEventsProcessed = 0
  private readonly recentEvents: TelemetryEvent[] = []

  @EventPattern('telemetry.event')
  handleTelemetryEvent(@Payload() rawPayload: unknown): TelemetryEvent | null {
    const parsed = TelemetryEventSchema.safeParse(rawPayload)
    if (!parsed.success) {
      this.logger.warn(`Invalid telemetry payload received: ${parsed.error.message}`)
      return null
    }

    const enriched: TelemetryEvent = {
      ...parsed.data,
      timestamp: parsed.data.timestamp || new Date().toISOString(),
    }

    this.totalEventsProcessed += 1
    this.recentEvents.unshift(enriched)
    if (this.recentEvents.length > 50) {
      this.recentEvents.pop()
    }

    this.logger.log(`[Event #${this.totalEventsProcessed}] ${enriched.type}: ${enriched.message}`)

    return enriched
  }

  @MessagePattern('telemetry.stats')
  getStats(): {
    totalEventsProcessed: number
    recentEvents: TelemetryEvent[]
    uptimeSeconds: number
  } {
    return {
      totalEventsProcessed: this.totalEventsProcessed,
      recentEvents: this.recentEvents.slice(0, 10),
      uptimeSeconds: Math.floor(process.uptime()),
    }
  }
}
