'use client'

import {
  type PaginatedSystemEventsResponse,
  PaginatedSystemEventsResponseSchema,
  type SystemCapabilities,
  SystemCapabilitiesSchema,
  TelemetryEventSchema,
  type TelemetryEventType,
} from '@repo/shared-schemas'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

export const SYSTEM_CAPABILITIES_QUERY_KEY = ['system', 'capabilities'] as const
export const TELEMETRY_STATS_QUERY_KEY = ['telemetry', 'stats'] as const
export const TELEMETRY_EVENTS_QUERY_KEY = ['telemetry', 'events'] as const

export const TelemetryStatsResponseSchema = z.object({
  totalEventsProcessed: z.number().int().nonnegative(),
  recentEvents: z.array(TelemetryEventSchema),
  microserviceConnected: z.boolean(),
})
export type TelemetryStatsResponse = z.infer<typeof TelemetryStatsResponseSchema>

async function fetchSystemCapabilities(): Promise<SystemCapabilities> {
  const res = await fetch('/api/capabilities', {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch capabilities (${res.status})`)
  }
  const data: unknown = await res.json()
  return SystemCapabilitiesSchema.parse(data)
}

export function useSystemCapabilities() {
  return useQuery({
    queryKey: SYSTEM_CAPABILITIES_QUERY_KEY,
    queryFn: fetchSystemCapabilities,
    staleTime: 1000 * 30,
  })
}

async function fetchTelemetryStats(): Promise<TelemetryStatsResponse> {
  const res = await fetch('/api/telemetry/stats', {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch telemetry stats (${res.status})`)
  }
  const data: unknown = await res.json()
  return TelemetryStatsResponseSchema.parse(data)
}

export function useTelemetryStats() {
  return useQuery({
    queryKey: TELEMETRY_STATS_QUERY_KEY,
    queryFn: fetchTelemetryStats,
    staleTime: 1000 * 15,
  })
}

export interface UsePaginatedTelemetryEventsParams {
  limit?: number
  eventType?: TelemetryEventType | undefined
}

async function fetchPaginatedTelemetryEvents(params: {
  limit: number
  cursor?: string | undefined
  eventType?: TelemetryEventType | undefined
}): Promise<PaginatedSystemEventsResponse> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
  })
  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }
  if (params.eventType) {
    searchParams.set('eventType', params.eventType)
  }

  const res = await fetch(`/api/telemetry/events?${searchParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch telemetry events (${res.status})`)
  }
  const data: unknown = await res.json()
  return PaginatedSystemEventsResponseSchema.parse(data)
}

export function usePaginatedTelemetryEvents(params: UsePaginatedTelemetryEventsParams = {}) {
  const limit = params.limit ?? 8

  return useInfiniteQuery({
    queryKey: [...TELEMETRY_EVENTS_QUERY_KEY, { limit, eventType: params.eventType ?? null }] as const,
    queryFn: ({ pageParam }) =>
      fetchPaginatedTelemetryEvents({
        limit,
        cursor: pageParam,
        eventType: params.eventType,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined),
    staleTime: 1000 * 15,
  })
}
