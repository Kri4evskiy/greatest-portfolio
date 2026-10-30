'use client'

import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { trackEvent } from '@/lib/analytics'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations('Header')

  const handleToggle = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    trackEvent('theme_toggled', { theme: nextTheme })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t('themeToggle')}
      title={t('themeToggle')}
      className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{t('themeToggle')}</span>
    </button>
  )
}
