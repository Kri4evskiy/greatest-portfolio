'use client'

import { Badge, Button } from '@repo/ui'
import { BookOpen, FileText, Lock, LockOpen, LogOut, ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLogoutMutation, useVisitorProfile } from '@/hooks/use-visitor-profile'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

export function WorkfolioHeader() {
  const t = useTranslations('Header')
  const pathname = usePathname()
  const router = useRouter()
  const { data: profile } = useVisitorProfile()
  const logoutMutation = useLogoutMutation()
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)

  const currentRole = profile?.role ?? 'GUEST'
  const isUnlocked = currentRole === 'USER' || currentRole === 'ADMIN'
  const isInsideKnowledgeBase = pathname.startsWith('/knowledge-base')

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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium text-foreground transition-opacity hover:opacity-80"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded border border-border bg-muted font-mono text-xs font-bold">
              W
            </span>
            <span className="font-mono text-xs text-muted-foreground hidden sm:inline">workspace /</span>
            <span className="font-semibold tracking-tight">workfolio-cv</span>
          </Link>

          {isInsideKnowledgeBase ? (
            <>
              <span className="font-mono text-xs text-muted-foreground">/</span>
              <Badge variant="secondary" className="font-mono text-xs">
                knowledge-base
              </Badge>
            </>
          ) : (
            <Badge variant="success" className="hidden md:inline-flex text-[11px]">
              {t('availableBadge')}
            </Badge>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <Link href="/#about" className="hover:text-foreground transition-colors">
            {t('nav.about')}
          </Link>
          <Link href="/#projects" className="hover:text-foreground transition-colors">
            {t('nav.projects')}
          </Link>
          <Link href="/#experience" className="hover:text-foreground transition-colors">
            {t('nav.experience')}
          </Link>
          <Link href="/#tech-radar" className="hover:text-foreground transition-colors">
            {t('nav.techRadar')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          {isUnlocked ? (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant={isInsideKnowledgeBase ? 'secondary' : 'default'}
                size="sm"
                onClick={handleKnowledgeBaseClick}
                className="gap-1.5 text-xs"
              >
                <LockOpen className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{t('knowledgeBase')}</span>
                <Badge
                  variant={currentRole === 'ADMIN' ? 'warning' : 'success'}
                  className="ml-0.5 px-1.5 py-0 font-mono text-[10px]"
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
              className="group gap-2 border-primary/30 bg-background text-xs font-medium hover:border-primary hover:bg-accent"
            >
              <Lock className="h-3.5 w-3.5 text-amber-600 transition-transform group-hover:scale-110" />
              <span>{t('knowledgeBase')}</span>
              <Badge variant="warning" className="hidden sm:inline-flex px-1.5 py-0 font-mono text-[10px]">
                {t('protectedBadge')}
              </Badge>
            </Button>
          )}

          {!isInsideKnowledgeBase ? (
            <a
              href="#tech-radar"
              className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>ADR</span>
            </a>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>CV</span>
            </Link>
          )}
        </div>
      </div>

      {!isUnlocked && isInsideKnowledgeBase ? (
        <div className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-1 text-center text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
          {t('guestBanner')}
        </div>
      ) : null}
    </header>
  )
}
