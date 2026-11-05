'use client'

import { DEFAULT_LOCALE, SupportedLocale } from '@repo/shared-schemas'
import { Button } from '@repo/ui'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

const ERROR_TEXTS: Record<
  SupportedLocale,
  {
    title: string
    description: string
    retry: string
  }
> = {
  en: {
    title: 'An unexpected rendering error occurred',
    description: 'Exception caught by global boundary Sentry GlobalError.',
    retry: 'Try again',
  },
  uk: {
    title: 'Сталася непередбачена помилка рендерингу',
    description: 'Виняток перехоплено глобальним баундері Sentry GlobalError.',
    retry: 'Спробувати знову',
  },
  ru: {
    title: 'Произошла непредвиденная ошибка рендера',
    description: 'Исключение перехвачено глобальным баундари Sentry GlobalError.',
    retry: 'Попробовать снова',
  },
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<SupportedLocale>(DEFAULT_LOCALE)

  useEffect(() => {
    const pathname = window.location.pathname
    let resolvedLocale: SupportedLocale = DEFAULT_LOCALE

    if (pathname.startsWith('/ua')) {
      resolvedLocale = 'uk'
    } else if (pathname.startsWith('/ru')) {
      resolvedLocale = 'ru'
    }

    setLang(resolvedLocale)
    document.documentElement.lang = resolvedLocale

    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    console.error(`[Sentry ErrorBoundary (${sentryDsn ? 'DSN active' : 'Graceful No-Op'})]:`, error)
  }, [error])

  const t = ERROR_TEXTS[lang] ?? ERROR_TEXTS[DEFAULT_LOCALE]

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-bold">{t.title}</h2>
          <p className="text-xs text-muted-foreground">{t.description}</p>
          <Button type="button" onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>{t.retry}</span>
          </Button>
        </div>
      </body>
    </html>
  )
}
