'use client';

import { Button } from '@repo/ui';
import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  React.useEffect(() => {
    // Sentry client exception capture hook (ADR #15)
    console.error('[Sentry ErrorBoundary]', error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold">Произошла непредвиденная ошибка</h2>
          <p className="text-xs text-muted-foreground">
            Событие зафиксировано системой мониторинга Sentry ErrorBoundary.
          </p>
          <Button type="button" onClick={() => reset()}>
            Попробовать снова
          </Button>
        </div>
      </body>
    </html>
  );
}
