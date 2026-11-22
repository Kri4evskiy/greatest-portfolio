import { z } from 'zod'
import { CursorPaginationQuerySchema, createCursorPaginatedResponseSchema } from './pagination.schema.js'
import { VisitorRoleTypeEnum } from './roles.schema.js'

export const TelemetryEventTypeEnum = z.enum([
  'GUEST_PASS_ISSUED',
  'ARTICLE_VIEWED',
  'ARTICLE_HELPFUL',
  'SYSTEM_HEARTBEAT',
])
export type TelemetryEventType = z.infer<typeof TelemetryEventTypeEnum>

export const TelemetryEventSchema = z.object({
  id: z.uuid(),
  type: TelemetryEventTypeEnum,
  message: z.string().min(1),
  actorName: z.string().optional(),
  actorRole: VisitorRoleTypeEnum.optional(),
  slug: z.string().optional(),
  timestamp: z.iso.datetime(),
})
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>

export const SystemEventLogItemSchema = z.object({
  id: z.uuid(),
  type: TelemetryEventTypeEnum,
  message: z.string().min(1),
  actorRole: VisitorRoleTypeEnum.optional(),
  slug: z.string().optional(),
  createdAt: z.iso.datetime(),
})
export type SystemEventLogItem = z.infer<typeof SystemEventLogItemSchema>

export const SystemEventsQuerySchema = CursorPaginationQuerySchema.extend({
  eventType: TelemetryEventTypeEnum.optional(),
})
export type SystemEventsQuery = z.infer<typeof SystemEventsQuerySchema>

export const PaginatedSystemEventsResponseSchema = createCursorPaginatedResponseSchema(SystemEventLogItemSchema)
export type PaginatedSystemEventsResponse = z.infer<typeof PaginatedSystemEventsResponseSchema>

export const TelemetryStatsResponseSchema = z.object({
  totalEventsProcessed: z.number().int().nonnegative(),
  recentEvents: z.array(TelemetryEventSchema),
  microserviceConnected: z.boolean(),
})
export type TelemetryStatsResponse = z.infer<typeof TelemetryStatsResponseSchema>
