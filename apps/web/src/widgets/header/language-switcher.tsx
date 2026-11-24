'use client'

import {
  DEFAULT_LOCALE,
  LOCALE_METADATA,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  SupportedLocaleEnum,
} from '@repo/shared-schemas'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui'
import { Check, Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { usePathname, useRouter } from '@/shared/i18n/navigation'
import { trackEvent } from '@/shared/lib/analytics'

export function LanguageSwitcher() {
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale: SupportedLocale = parsedLocale.success ? parsedLocale.data : DEFAULT_LOCALE
  const t = useTranslations('Header')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false)

  const handleSelectLocale = (nextLocale: SupportedLocale) => {
    setIsMobilePopoverOpen(false)
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
    <div className="inline-flex items-center">
      {/* Mobile compact Popover switcher (< sm) */}
      <Popover open={isMobilePopoverOpen} onOpenChange={setIsMobilePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            aria-label={t('languageLabel')}
            className="h-8 gap-1 bg-muted/40 px-2 font-mono text-[11px] font-medium text-foreground sm:hidden"
          >
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span>{activeMeta.shortLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-36 p-1 sm:hidden">
          <fieldset aria-label={t('languageLabel')} className="space-y-0.5 border-0 p-0">
            {SUPPORTED_LOCALES.map((code) => {
              const meta = LOCALE_METADATA[code]
              const isActive = locale === code
              return (
                <Button
                  key={code}
                  type="button"
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  disabled={isPending}
                  aria-pressed={isActive}
                  onClick={() => handleSelectLocale(code)}
                  className={`h-auto w-full justify-between px-2.5 py-1.5 text-left text-xs ${
                    isActive
                      ? 'font-semibold text-foreground'
                      : 'font-normal text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{meta.nativeName}</span>
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    {meta.shortLabel}
                    {isActive ? <Check className="h-3 w-3 text-primary" /> : null}
                  </span>
                </Button>
              )
            })}
          </fieldset>
        </PopoverContent>
      </Popover>

      {/* Desktop & Tablet segmented ToggleGroup (>= sm) */}
      <ToggleGroup
        type="single"
        variant="segmented"
        size="xs"
        value={locale}
        disabled={isPending}
        aria-label={t('languageLabel')}
        onValueChange={(nextValue) => {
          const parsed = SupportedLocaleEnum.safeParse(nextValue)
          if (parsed.success) {
            handleSelectLocale(parsed.data)
          }
        }}
        className="hidden h-8 rounded-md border-border bg-muted/40 p-0.5 sm:inline-flex"
      >
        <Globe aria-hidden="true" className="ml-1.5 mr-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {SUPPORTED_LOCALES.map((code) => {
          const meta = LOCALE_METADATA[code]
          return (
            <Tooltip key={code}>
              {/* Nest TooltipTrigger inside ToggleGroupItem asChild so ToggleGroup's data-state="on|off" is not overwritten by TooltipTrigger */}
              <ToggleGroupItem
                value={code}
                asChild
                aria-label={meta.nativeName}
                className="rounded-sm font-mono hover:bg-background/50 data-[state=on]:shadow-xs data-[state=on]:hover:bg-background"
              >
                <TooltipTrigger type="button">{meta.shortLabel}</TooltipTrigger>
              </ToggleGroupItem>
              <TooltipContent side="bottom">{meta.nativeName}</TooltipContent>
            </Tooltip>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
