'use client'

import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { useIsRestoring } from '@tanstack/react-query'
import { FileDown, FileText, Lock, LockOpen, LogOut, Search, ShieldAlert } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useLogoutMutation, useVisitorProfile } from '@/features/auth/queries/use-visitor-profile'
import { prefetchKnowledgeSearchIndex } from '@/features/search/search-index-client'
import { useSectionNavigation } from '@/shared/hooks/use-section-navigation'
import { Link, usePathname, useRouter } from '@/shared/i18n/navigation'
import { trackEvent } from '@/shared/lib/analytics'
import { useUIActions } from '@/shared/store/use-ui-store'
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
  const { data: profile, isPending: isProfilePending } = useVisitorProfile()
  const isRestoring = useIsRestoring()
  const isSessionChecking = isRestoring || (isProfilePending && profile === undefined)
  const logoutMutation = useLogoutMutation()
  const { openGuestPassModal, openCommandPalette } = useUIActions()

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
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border bg-muted font-mono text-[11px] font-bold">
              {AUTHOR_INITIALS}
            </span>
            <span className="hidden shrink-0 font-mono text-xs text-muted-foreground lg:inline">workfolio /</span>
            <span className="truncate font-semibold tracking-tight text-xs sm:text-sm">Stanislav Krychevskyi</span>
          </Link>

          {isInsideKnowledgeBase || isOnCvPage ? (
            <>
              <span className="hidden shrink-0 font-mono text-xs text-muted-foreground lg:inline">/</span>
              <Badge variant="secondary" className="hidden shrink-0 font-mono text-xs lg:inline-flex">
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground lg:w-auto lg:gap-2 lg:px-2.5"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden text-xs lg:inline">{t('searchPlaceholder')}</span>
            <kbd className="hidden rounded-sm border border-border bg-background px-1 py-0.5 font-mono text-[10px] xl:inline">
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
                  className="hidden px-1.5 py-0 font-mono text-[10px] lg:inline-flex"
                >
                  {currentRole}
                </Badge>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('logoutTitle', { name: profile?.displayName ?? 'Guest' })}
                    onClick={() => {
                      void logoutMutation.mutateAsync().then(() => {
                        if (isInsideKnowledgeBase) {
                          router.push('/')
                        }
                      })
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('logoutTitle', { name: profile?.displayName ?? 'Guest' })}
                </TooltipContent>
              </Tooltip>
            </div>
          ) : isSessionChecking && isInsideKnowledgeBase ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleKnowledgeBaseClick}
              className="h-8 gap-1 px-2.5 text-xs sm:gap-1.5 sm:px-3"
            >
              <LockOpen className="h-3.5 w-3.5 shrink-0 text-success" />
              <span className="sm:hidden">{t('knowledgeBaseShort')}</span>
              <span className="hidden sm:inline">{t('knowledgeBase')}</span>
            </Button>
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
              <Badge variant="warning" className="hidden px-1.5 py-0 font-mono text-[10px] lg:inline-flex">
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

      {!isSessionChecking && !isUnlocked && isInsideKnowledgeBase ? (
        <div className="border-t border-warning/30 bg-warning/10 px-4 py-1 text-center text-xs text-warning">
          <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
          {t('guestBanner')}
        </div>
      ) : null}
    </header>
  )
}
