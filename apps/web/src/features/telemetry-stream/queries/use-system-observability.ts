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
import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'

export const SYSTEM_CAPABILITIES_QUERY_KEY = ['system', 'capabilities'] as const
export const TELEMETRY_STATS_QUERY_KEY = ['telemetry', 'stats'] as const
export const TELEMETRY_EVENTS_QUERY_KEY = ['telemetry', 'events'] as const

export interface FetchPaginatedTelemetryEventsParams {
  limit: number
  cursor?: string | undefined
  eventType?: TelemetryEventType | undefined
}

export interface UsePaginatedTelemetryEventsParams {
  limit?: number
  eventType?: TelemetryEventType | undefined
}

export function fetchSystemCapabilities(signal?: AbortSignal): Promise<SystemCapabilities> {
  return apiClient.get(API_ENDPOINTS.capabilities, SystemCapabilitiesSchema, { signal })
}

export function fetchTelemetryStats(signal?: AbortSignal): Promise<TelemetryStatsResponse> {
  return apiClient.get(API_ENDPOINTS.telemetryStats, TelemetryStatsResponseSchema, { signal })
}

export function fetchPaginatedTelemetryEvents(
  params: FetchPaginatedTelemetryEventsParams,
  signal?: AbortSignal,
): Promise<PaginatedSystemEventsResponse> {
  return apiClient.get(API_ENDPOINTS.telemetryEvents, PaginatedSystemEventsResponseSchema, {
    signal,
    params: {
      limit: params.limit,
      cursor: params.cursor,
      eventType: params.eventType,
    },
  })
}

export function systemCapabilitiesQueryOptions() {
  return queryOptions({
    queryKey: SYSTEM_CAPABILITIES_QUERY_KEY,
    queryFn: ({ signal }) => fetchSystemCapabilities(signal),
    staleTime: 1000 * 30,
  })
}

export function telemetryStatsQueryOptions() {
  return queryOptions({
    queryKey: TELEMETRY_STATS_QUERY_KEY,
    queryFn: ({ signal }) => fetchTelemetryStats(signal),
    staleTime: 1000 * 15,
  })
}

export function paginatedTelemetryEventsQueryOptions(params: UsePaginatedTelemetryEventsParams = {}) {
  const limit = params.limit ?? 8

  return infiniteQueryOptions({
    queryKey: [...TELEMETRY_EVENTS_QUERY_KEY, { limit, eventType: params.eventType ?? null }] as const,
    queryFn: ({ pageParam, signal }) =>
      fetchPaginatedTelemetryEvents(
        {
          limit,
          cursor: pageParam,
          eventType: params.eventType,
        },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined),
    staleTime: 1000 * 15,
  })
}

export function useSystemCapabilities() {
  return useQuery(systemCapabilitiesQueryOptions())
}

export function useTelemetryStats() {
  return useQuery(telemetryStatsQueryOptions())
}

export function usePaginatedTelemetryEvents(params: UsePaginatedTelemetryEventsParams = {}) {
  return useInfiniteQuery(paginatedTelemetryEventsQueryOptions(params))
}
