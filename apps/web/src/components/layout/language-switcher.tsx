'use client'

import { LOCALE_METADATA, SUPPORTED_LOCALES, type SupportedLocale } from '@repo/shared-schemas'
import { Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'

export function LanguageSwitcher() {
  const locale = useLocale() as SupportedLocale
  const t = useTranslations('Header')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSelectLocale = (nextLocale: SupportedLocale) => {
    if (nextLocale === locale) return

    trackEvent('language_switched', {
      from: locale,
      to: nextLocale,
      pathname,
    })

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <fieldset
      aria-label={t('languageLabel')}
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5"
    >
      <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
      {SUPPORTED_LOCALES.map((code) => {
        const meta = LOCALE_METADATA[code]
        const isActive = locale === code
        return (
          <button
            key={code}
            type="button"
            disabled={isPending}
            title={meta.nativeName}
            onClick={() => handleSelectLocale(code)}
            className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium transition-colors ${
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            }`}
          >
            {meta.shortLabel}
          </button>
        )
      })}
    </fieldset>
  )
}
