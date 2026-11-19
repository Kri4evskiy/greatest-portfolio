import { z } from 'zod'
import { createCursorPaginatedResponseSchema } from './pagination.schema.js'
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

export const PaginatedSystemEventsResponseSchema = createCursorPaginatedResponseSchema(SystemEventLogItemSchema)
export type PaginatedSystemEventsResponse = z.infer<typeof PaginatedSystemEventsResponseSchema>
