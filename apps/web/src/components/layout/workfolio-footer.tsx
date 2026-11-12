import type { SupportedLocale } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { Database, ExternalLink, FileDown, Github, Linkedin, Mail, MapPin, Send } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AUTHOR_PROFILE, pickLocalized } from '@/data/author-profile'
import { Link } from '@/i18n/navigation'
import { FooterSseStatus } from './footer-sse-status'

export async function WorkfolioFooter({ locale }: { locale: SupportedLocale }) {
  const t = await getTranslations({ locale, namespace: 'Footer' })

  return (
    <footer className="mt-16 border-t border-border/70 bg-surface-subtle sm:mt-20">
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-8 sm:px-6 xl:pb-10">
        {/* Top Row: Personal Contact Identity + Direct Links */}
        <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {pickLocalized(AUTHOR_PROFILE.fullName, locale)}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="font-mono text-xs text-primary">{pickLocalized(AUTHOR_PROFILE.roleTitle, locale)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {pickLocalized(AUTHOR_PROFILE.location, locale)}
              </span>
              <span>•</span>
              <span>{t('contactPrompt')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/cv"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10"
            >
              <FileDown className="h-3.5 w-3.5 text-primary" />
              <span>CV (PDF)</span>
            </Link>
            <a
              href={AUTHOR_PROFILE.contacts.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <Send className="h-3.5 w-3.5 text-primary" />
              <span>Telegram</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href={AUTHOR_PROFILE.contacts.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <Linkedin className="h-3.5 w-3.5 text-primary" />
              <span>LinkedIn</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href={AUTHOR_PROFILE.contacts.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <Github className="h-3.5 w-3.5 text-primary" />
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href={`mailto:${AUTHOR_PROFILE.contacts.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>{AUTHOR_PROFILE.contacts.email}</span>
            </a>
          </div>
        </div>

        {/* Bottom Row: Monorepo Telemetry & Version Metadata */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={AUTHOR_PROFILE.contacts.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Kri4evskiy/greatest-portfolio
              </a>
              <Badge variant="secondary" className="font-mono text-[11px]">
                <Database className="mr-1 h-3 w-3" />
                IndexedDB Offline-First
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Monorepo: Next.js 16 (App Router) • NestJS 12 (Native ESM) • Prisma (Neon PostgreSQL) • Microservices TCP
              &amp; SSE
            </p>
          </div>

          <FooterSseStatus waitingLabel={t('waitingPulse')} />
        </div>
      </div>
    </footer>
  )
}
