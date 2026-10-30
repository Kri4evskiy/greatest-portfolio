'use client';

import {
  type GuestPassFormInput,
  type SessionProfile,
  SessionProfileSchema,
} from '@repo/shared-schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const VISITOR_PROFILE_QUERY_KEY = ['auth', 'me'] as const;

const FALLBACK_GUEST_PROFILE: SessionProfile = {
  id: null,
  displayName: null,
  visitorType: null,
  role: 'GUEST',
  expiresAt: null,
};

async function fetchVisitorProfile(): Promise<SessionProfile> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      return FALLBACK_GUEST_PROFILE;
    }
    const data: unknown = await res.json();
    const parsed = SessionProfileSchema.safeParse(data);
    return parsed.success ? parsed.data : FALLBACK_GUEST_PROFILE;
  } catch {
    return FALLBACK_GUEST_PROFILE;
  }
}

export function useVisitorProfile() {
  return useQuery({
    queryKey: VISITOR_PROFILE_QUERY_KEY,
    queryFn: fetchVisitorProfile,
    staleTime: 1000 * 60 * 10,
  });
}

export function useIssueGuestPassMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GuestPassFormInput): Promise<SessionProfile> => {
      const res = await fetch('/api/auth/guest-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? 'Не удалось выпустить гостевой пропуск');
      }

      const data: unknown = await res.json();
      return SessionProfileSchema.parse(data);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(VISITOR_PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SessionProfile> => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        return FALLBACK_GUEST_PROFILE;
      }
      const data: unknown = await res.json();
      const parsed = SessionProfileSchema.safeParse(data);
      return parsed.success ? parsed.data : FALLBACK_GUEST_PROFILE;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(VISITOR_PROFILE_QUERY_KEY, profile);
    },
  });
}
