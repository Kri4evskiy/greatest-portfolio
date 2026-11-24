'use client'

import { API_ENDPOINTS, type GuestPassFormInput, type SessionProfile, SessionProfileSchema } from '@repo/shared-schemas'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError, apiClient } from '@/shared/lib/api-client'
import { broadcastAuthSessionChange } from '../lib/auth-cross-tab-sync'

export const VISITOR_PROFILE_QUERY_KEY = ['auth', 'me'] as const

const FALLBACK_GUEST_PROFILE: SessionProfile = {
  id: null,
  displayName: null,
  visitorType: null,
  role: 'GUEST',
  expiresAt: null,
}

export async function fetchVisitorProfile(signal?: AbortSignal): Promise<SessionProfile> {
  try {
    return await apiClient.get(API_ENDPOINTS.authMe, SessionProfileSchema, { signal })
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    // Only coerce explicit 401/403 auth responses into a cached GUEST profile.
    // Transient 5xx/network failures must reject so TanStack Query does NOT cache
    // an authenticated user as GUEST for staleTime (10m).
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      return FALLBACK_GUEST_PROFILE
    }
    throw error
  }
}

export function issueGuestPass(input: GuestPassFormInput): Promise<SessionProfile> {
  return apiClient.post(API_ENDPOINTS.authGuestPass, SessionProfileSchema, input)
}

export async function logoutVisitorSession(): Promise<SessionProfile> {
  try {
    return await apiClient.post(API_ENDPOINTS.authLogout, SessionProfileSchema)
  } catch {
    return FALLBACK_GUEST_PROFILE
  }
}

export function visitorProfileQueryOptions() {
  return queryOptions({
    queryKey: VISITOR_PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => fetchVisitorProfile(signal),
    staleTime: 1000 * 60 * 10,
  })
}

export function useVisitorProfile() {
  return useQuery(visitorProfileQueryOptions())
}

export function useIssueGuestPassMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: issueGuestPass,
    onSuccess: (profile) => {
      queryClient.setQueryData(VISITOR_PROFILE_QUERY_KEY, profile)
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      broadcastAuthSessionChange()
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutVisitorSession,
    onSuccess: (profile) => {
      queryClient.setQueryData(VISITOR_PROFILE_QUERY_KEY, profile)
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      broadcastAuthSessionChange()
    },
  })
}
