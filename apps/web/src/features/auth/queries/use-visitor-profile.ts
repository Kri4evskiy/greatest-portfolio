'use client'

import { API_ENDPOINTS, type GuestPassFormInput, type SessionProfile, SessionProfileSchema } from '@repo/shared-schemas'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiClient } from '@/shared/lib/api-client'
import { broadcastAuthSessionChange, subscribeAuthSessionChange } from '../lib/auth-cross-tab-sync'

export const VISITOR_PROFILE_QUERY_KEY = ['auth', 'me'] as const

const FALLBACK_GUEST_PROFILE: SessionProfile = {
  id: null,
  displayName: null,
  visitorType: null,
  role: 'GUEST',
  expiresAt: null,
}

async function fetchVisitorProfile(signal?: AbortSignal): Promise<SessionProfile> {
  try {
    return await apiClient.get(API_ENDPOINTS.authMe, SessionProfileSchema, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    return FALLBACK_GUEST_PROFILE
  }
}

export function useVisitorProfile() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeAuthSessionChange(() => {
      void queryClient.invalidateQueries({ queryKey: VISITOR_PROFILE_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] })
    })
  }, [queryClient])

  return useQuery({
    queryKey: VISITOR_PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => fetchVisitorProfile(signal),
    staleTime: 1000 * 60 * 10,
  })
}

export function useIssueGuestPassMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: GuestPassFormInput): Promise<SessionProfile> =>
      apiClient.post(API_ENDPOINTS.authGuestPass, SessionProfileSchema, input),
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
    mutationFn: async (): Promise<SessionProfile> => {
      try {
        return await apiClient.post(API_ENDPOINTS.authLogout, SessionProfileSchema)
      } catch {
        return FALLBACK_GUEST_PROFILE
      }
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(VISITOR_PROFILE_QUERY_KEY, profile)
      broadcastAuthSessionChange()
    },
  })
}
