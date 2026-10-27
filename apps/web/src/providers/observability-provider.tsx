'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';

export function ObservabilityProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();

  React.useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (posthogKey) {
      // Lightweight PostHog pageview telemetry hook (ADR #15)
      console.debug('[PostHog] pageview:', pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
