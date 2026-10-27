'use client';

import type { GuestPassFormInput, SessionProfile } from '@repo/shared-schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const SESSION_QUERY_KEY = ['visitor-session'] as const;

const DEFAULT_GUEST_SESSION: SessionProfile = {
  id: null,
  displayName: null,
  visitorType: null,
  role: 'GUEST',
  expiresAt: null,
};

async function fetchVisitorSession(): Promise<SessionProfile> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      return DEFAULT_GUEST_SESSION;
    }
    return (await response.json()) as SessionProfile;
  } catch {
    return DEFAULT_GUEST_SESSION;
  }
}

export function useVisitorProfile() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchVisitorSession,
    placeholderData: DEFAULT_GUEST_SESSION,
  });
}

export function useIssueGuestPass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GuestPassFormInput): Promise<SessionProfile> => {
      const response = await fetch('/api/auth/guest-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error('Failed to issue Guest Pass');
      }
      return (await response.json()) as SessionProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, profile);
    },
  });
}

export function useLogoutVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SessionProfile> => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        return DEFAULT_GUEST_SESSION;
      }
      return (await response.json()) as SessionProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, profile);
    },
  });
}
