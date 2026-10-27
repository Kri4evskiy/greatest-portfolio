import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { type TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas';

@Controller()
export class TelemetryMsController {
  private readonly logger = new Logger(TelemetryMsController.name);
  private totalProcessedEvents = 0;
  private readonly countersByType: Record<string, number> = {
    GUEST_PASS_ISSUED: 0,
    ARTICLE_VIEWED: 0,
    ARTICLE_HELPFUL: 0,
    SYSTEM_HEARTBEAT: 0,
  };

  @EventPattern('telemetry.event')
  handleTelemetryEvent(@Payload() rawPayload: unknown): void {
    const parsed = TelemetryEventSchema.safeParse(rawPayload);
    if (!parsed.success) {
      this.logger.warn('Ignored malformed telemetry event payload');
      return;
    }

    const event: TelemetryEvent = parsed.data;
    this.totalProcessedEvents += 1;
    this.countersByType[event.type] = (this.countersByType[event.type] ?? 0) + 1;

    this.logger.log(`[Event #${this.totalProcessedEvents}] ${event.type}: ${event.message}`);
  }

  @MessagePattern('telemetry.stats')
  getAggregatedStats(): {
    totalProcessedEvents: number;
    countersByType: Record<string, number>;
    uptimeSeconds: number;
  } {
    return {
      totalProcessedEvents: this.totalProcessedEvents,
      countersByType: this.countersByType,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
