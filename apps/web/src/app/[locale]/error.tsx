'use client'

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Link } from '@/shared/i18n/navigation'

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('ErrorPage')

  useEffect(() => {
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    console.error(`[Sentry LocaleErrorBoundary (${sentryDsn ? 'DSN active' : 'Graceful No-Op'})]:`, error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full border-border bg-card shadow-sm">
        <CardHeader className="space-y-3 text-center sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <Badge variant="warning" className="gap-1.5 font-mono text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{t('badge')}</span>
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">{t('title')}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {t('description')}
          </CardDescription>
          {error.digest ? (
            <p className="rounded-md border border-border/70 bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {t('digestLabel')} <span className="font-semibold text-foreground">{error.digest}</span>
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>{t('retryBtn')}</span>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span>{t('backHomeBtn')}</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
