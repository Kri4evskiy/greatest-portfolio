'use client'

import { LOCALE_METADATA, SUPPORTED_LOCALES, type SupportedLocale } from '@repo/shared-schemas'
import { Check, Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'

export function LanguageSwitcher() {
  const locale = useLocale() as SupportedLocale
  const t = useTranslations('Header')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMobileDropdownOpen) return

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside, { passive: true })

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [isMobileDropdownOpen])

  const handleSelectLocale = (nextLocale: SupportedLocale) => {
    setIsMobileDropdownOpen(false)
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

  const activeMeta = LOCALE_METADATA[locale]

  return (
    <div ref={dropdownRef} className="relative">
      {/* Mobile compact single-button trigger (< sm) */}
      <button
        type="button"
        disabled={isPending}
        aria-label={t('languageLabel')}
        aria-expanded={isMobileDropdownOpen}
        onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted/40 px-2 font-mono text-[11px] font-medium text-foreground transition-colors hover:bg-accent sm:hidden"
      >
        <Globe className="h-3 w-3 text-muted-foreground" />
        <span>{activeMeta.shortLabel}</span>
      </button>

      {isMobileDropdownOpen ? (
        <div className="absolute right-0 top-9 z-50 w-36 rounded-lg border border-border bg-card p-1 shadow-lg sm:hidden">
          {SUPPORTED_LOCALES.map((code) => {
            const meta = LOCALE_METADATA[code]
            const isActive = locale === code
            return (
              <button
                key={code}
                type="button"
                disabled={isPending}
                onClick={() => handleSelectLocale(code)}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isActive ? 'bg-accent font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{meta.nativeName}</span>
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  {meta.shortLabel}
                  {isActive ? <Check className="h-3 w-3 text-primary" /> : null}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {/* Desktop & Tablet inline segmented control (>= sm) */}
      <fieldset
        aria-label={t('languageLabel')}
        className="hidden items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5 sm:inline-flex"
      >
        <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
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
    </div>
  )
}
