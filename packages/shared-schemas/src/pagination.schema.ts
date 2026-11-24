import { z } from 'zod'

export const OffsetPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(500).default(0),
})
export type OffsetPaginationQuery = z.infer<typeof OffsetPaginationQuerySchema>

export const CursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
  cursor: z.uuid().optional(),
})
export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>

export function createOffsetPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().nonnegative(),
    hasMore: z.boolean(),
    nextOffset: z.number().int().nonnegative().nullable(),
  })
}

export function createCursorPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    limit: z.number().int().min(1).max(50),
    hasMore: z.boolean(),
    nextCursor: z.uuid().nullable(),
  })
}
