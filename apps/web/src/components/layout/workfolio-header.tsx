'use client'

import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Button } from '@repo/ui'
import { FileDown, FileText, Lock, LockOpen, LogOut, Search, ShieldAlert } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useSectionNavigation } from '@/hooks/use-section-navigation'
import { useLogoutMutation, useVisitorProfile } from '@/hooks/use-visitor-profile'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { prefetchKnowledgeSearchIndex } from '@/lib/search-index-client'
import { useUIStore } from '@/store/use-ui-store'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

const AUTHOR_INITIALS = 'SK'

export function WorkfolioHeader() {
  const t = useTranslations('Header')
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale = parsedLocale.success ? parsedLocale.data : DEFAULT_LOCALE

  const pathname = usePathname()
  const router = useRouter()
  const { scrollToSection, scrollToTop } = useSectionNavigation()
  const { data: profile } = useVisitorProfile()
  const logoutMutation = useLogoutMutation()
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)
  const openCommandPalette = useUIStore((s) => s.openCommandPalette)

  const currentRole = profile?.role ?? 'GUEST'
  const isUnlocked = currentRole === 'USER' || currentRole === 'ADMIN'
  const isInsideKnowledgeBase = pathname.startsWith('/knowledge-base')
  const isOnCvPage = pathname === '/cv'

  const handleKnowledgeBaseClick = () => {
    if (isUnlocked) {
      router.push('/knowledge-base')
      return
    }
    trackEvent('guest_pass_modal_opened', { source: 'sticky_header_button' })
    openGuestPassModal('/knowledge-base')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault()
                scrollToTop()
              }
            }}
            className="flex min-w-0 items-center gap-1.5 font-medium text-foreground transition-opacity hover:opacity-80 sm:gap-2"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-muted font-mono text-[11px] font-bold">
              {AUTHOR_INITIALS}
            </span>
            <span className="hidden font-mono text-xs text-muted-foreground md:inline">workfolio /</span>
            <span className="truncate font-semibold tracking-tight text-xs sm:text-sm">Stanislav Krychevskyi</span>
          </Link>

          {isInsideKnowledgeBase || isOnCvPage ? (
            <>
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">/</span>
              <Badge variant="secondary" className="hidden font-mono text-xs sm:inline-flex">
                {isInsideKnowledgeBase ? 'knowledge-base' : 'cv.pdf'}
              </Badge>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label={t('searchAria')}
            title={t('searchAria')}
            onMouseEnter={() => prefetchKnowledgeSearchIndex(locale)}
            onFocus={() => prefetchKnowledgeSearchIndex(locale)}
            onClick={() => openCommandPalette('')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground md:w-auto md:gap-2 md:px-2.5"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden text-xs md:inline">{t('searchPlaceholder')}</span>
            <kbd className="hidden rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] lg:inline">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />
          <LanguageSwitcher />

          {isUnlocked ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Button
                type="button"
                variant={isInsideKnowledgeBase ? 'secondary' : 'default'}
                size="sm"
                onClick={handleKnowledgeBaseClick}
                className="h-8 gap-1 px-2.5 text-xs sm:gap-1.5 sm:px-3"
              >
                <LockOpen className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="sm:hidden">{t('knowledgeBaseShort')}</span>
                <span className="hidden sm:inline">{t('knowledgeBase')}</span>
                <Badge
                  variant={currentRole === 'ADMIN' ? 'warning' : 'success'}
                  className="hidden px-1.5 py-0 font-mono text-[10px] md:inline-flex"
                >
                  {currentRole}
                </Badge>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title={t('logoutTitle', { name: profile?.displayName ?? 'Guest' })}
                onClick={() => {
                  void logoutMutation.mutateAsync().then(() => {
                    if (isInsideKnowledgeBase) {
                      router.push('/')
                    }
                  })
                }}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleKnowledgeBaseClick}
              onMouseEnter={() => router.prefetch('/knowledge-base')}
              className="group h-8 gap-1.5 border-primary/30 bg-background px-2.5 text-xs font-medium hover:border-primary hover:bg-accent sm:gap-2 sm:px-3"
            >
              <Lock className="h-3.5 w-3.5 shrink-0 text-warning transition-transform group-hover:scale-110" />
              <span className="sm:hidden">{t('knowledgeBaseShort')}</span>
              <span className="hidden sm:inline">{t('knowledgeBase')}</span>
              <Badge variant="warning" className="hidden px-1.5 py-0 font-mono text-[10px] md:inline-flex">
                {t('protectedBadge')}
              </Badge>
            </Button>
          )}

          <Link
            href="/cv"
            title={t('cvButtonTitle')}
            className={`inline-flex h-8 items-center gap-1 rounded-md border px-2 font-mono text-xs font-medium transition-colors sm:px-2.5 ${
              isOnCvPage
                ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent'
            }`}
          >
            <FileDown className="h-3.5 w-3.5 shrink-0" />
            <span>CV</span>
          </Link>

          <button
            type="button"
            onClick={() => scrollToSection('tech-radar')}
            className="hidden h-8 items-center gap-1 rounded-md border border-border px-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex sm:px-2.5"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>ADR</span>
          </button>
        </div>
      </div>

      {!isUnlocked && isInsideKnowledgeBase ? (
        <div className="border-t border-warning/30 bg-warning/10 px-4 py-1 text-center text-xs text-warning">
          <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
          {t('guestBanner')}
        </div>
      ) : null}
    </header>
  )
}
