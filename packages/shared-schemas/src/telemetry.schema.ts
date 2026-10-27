import { z } from 'zod';
import { VisitorRoleTypeEnum } from './roles.schema';

export const TelemetryEventTypeEnum = z.enum([
  'GUEST_PASS_ISSUED',
  'ARTICLE_VIEWED',
  'ARTICLE_HELPFUL',
  'SYSTEM_HEARTBEAT',
]);
export type TelemetryEventType = z.infer<typeof TelemetryEventTypeEnum>;

export const TelemetryEventSchema = z.object({
  id: z.string().uuid(),
  type: TelemetryEventTypeEnum,
  message: z.string().min(1),
  actorName: z.string().optional(),
  actorRole: VisitorRoleTypeEnum.optional(),
  slug: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
