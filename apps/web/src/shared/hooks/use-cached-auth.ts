'use client'

import type { SessionProfile } from '@repo/shared-schemas'
import { skipToken, useQuery } from '@tanstack/react-query'

/**
 * Read-only reactive subscriber to the root `['auth', 'me']` TanStack Query cache.
 * Uses `skipToken` so it never triggers independent network fetches or emits
 * TanStack Query's missing-`queryFn` dev warning, while keeping `entities/*`
 * strictly decoupled from `features/auth/*` under FSD-Modular rules.
 */
export function useCachedAuth() {
  const { data: profile } = useQuery<SessionProfile>({
    queryKey: ['auth', 'me'],
    queryFn: skipToken,
  })

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  return {
    profile,
    isUnlocked,
  }
}
