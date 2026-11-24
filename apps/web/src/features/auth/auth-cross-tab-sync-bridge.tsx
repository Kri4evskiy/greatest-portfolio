'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { subscribeAuthSessionChange } from './lib/auth-cross-tab-sync'
import { VISITOR_PROFILE_QUERY_KEY } from './queries/use-visitor-profile'

/**
 * Mounted once at the root layout level (inside QueryProvider) so the entire browser tab
 * opens exactly ONE `BroadcastChannel('workfolio_auth_sync')` socket instead of one per
 * `useVisitorProfile()` consumer.
 */
export function AuthCrossTabSyncBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeAuthSessionChange(() => {
      void queryClient.invalidateQueries({ queryKey: VISITOR_PROFILE_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] })
    })
  }, [queryClient])

  return null
}
