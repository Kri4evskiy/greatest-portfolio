'use client'

import {
  API_ENDPOINTS,
  type PaginatedSystemEventsResponse,
  PaginatedSystemEventsResponseSchema,
  type SystemCapabilities,
  SystemCapabilitiesSchema,
  type TelemetryEventType,
  type TelemetryStatsResponse,
  TelemetryStatsResponseSchema,
} from '@repo/shared-schemas'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'

export const SYSTEM_CAPABILITIES_QUERY_KEY = ['system', 'capabilities'] as const
export const TELEMETRY_STATS_QUERY_KEY = ['telemetry', 'stats'] as const
export const TELEMETRY_EVENTS_QUERY_KEY = ['telemetry', 'events'] as const

export function useSystemCapabilities() {
  return useQuery({
    queryKey: SYSTEM_CAPABILITIES_QUERY_KEY,
    queryFn: ({ signal }): Promise<SystemCapabilities> =>
      apiClient.get(API_ENDPOINTS.capabilities, SystemCapabilitiesSchema, { signal }),
    staleTime: 1000 * 30,
  })
}

export function useTelemetryStats() {
  return useQuery({
    queryKey: TELEMETRY_STATS_QUERY_KEY,
    queryFn: ({ signal }): Promise<TelemetryStatsResponse> =>
      apiClient.get(API_ENDPOINTS.telemetryStats, TelemetryStatsResponseSchema, { signal }),
    staleTime: 1000 * 15,
  })
}

export interface UsePaginatedTelemetryEventsParams {
  limit?: number
  eventType?: TelemetryEventType | undefined
}

export function usePaginatedTelemetryEvents(params: UsePaginatedTelemetryEventsParams = {}) {
  const limit = params.limit ?? 8

  return useInfiniteQuery({
    queryKey: [...TELEMETRY_EVENTS_QUERY_KEY, { limit, eventType: params.eventType ?? null }] as const,
    queryFn: ({ pageParam, signal }): Promise<PaginatedSystemEventsResponse> =>
      apiClient.get(API_ENDPOINTS.telemetryEvents, PaginatedSystemEventsResponseSchema, {
        signal,
        params: {
          limit,
          cursor: pageParam,
          eventType: params.eventType,
        },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined),
    staleTime: 1000 * 15,
  })
}
