'use client'

import { Button } from '@repo/ui'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    console.error(`[Sentry ErrorBoundary (${sentryDsn ? 'DSN active' : 'Graceful No-Op'})]:`, error)
  }, [error])

  return (
    <html lang="ru">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-bold">Произошла непредвиденная ошибка рендера</h2>
          <p className="text-xs text-muted-foreground">
            Исключение перехвачено глобальным баундари <code>Sentry GlobalError</code>.
          </p>
          <Button type="button" onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Попробовать снова</span>
          </Button>
        </div>
      </body>
    </html>
  )
}
