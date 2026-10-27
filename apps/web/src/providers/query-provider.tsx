'use client';

import type { PersistedClient, Persister } from '@tanstack/query-persist-client-core';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import * as React from 'react';

const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;
const IDB_CACHE_KEY = 'greatest-portfolio-query-cache-v1';

function createIDBPersister(idbValidKey: IDBValidKey = IDB_CACHE_KEY): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      if (typeof window === 'undefined') return;
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      if (typeof window === 'undefined') return undefined;
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      if (typeof window === 'undefined') return;
      await del(idbValidKey);
    },
  };
}

export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [queryClient] = React.useState(
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

  const [persister] = React.useState(() => createIDBPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: TWENTY_FOUR_HOURS_MS,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
