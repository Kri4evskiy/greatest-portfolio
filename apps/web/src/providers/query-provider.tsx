'use client';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { type ReactNode, useState } from 'react';

const CACHE_KEY = 'greatest-portfolio-query-cache';
const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;

function createIndexedDbPersister() {
  return createAsyncStoragePersister({
    key: CACHE_KEY,
    storage: {
      getItem: async (key: string) => {
        if (typeof window === 'undefined') return null;
        const val = await get<string>(key);
        return val ?? null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        await set(key, value);
      },
      removeItem: async (key: string) => {
        if (typeof window === 'undefined') return;
        await del(key);
      },
    },
    throttleTime: 1000,
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: TWENTY_FOUR_HOURS_MS,
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [persister] = useState(() => createIndexedDbPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: TWENTY_FOUR_HOURS_MS,
        buster: 'v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
