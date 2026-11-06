'use client'

import { APP_VERSION, SupportedLocaleEnum, type TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { Activity, Database, ExternalLink, Github, Linkedin, Mail, MapPin, Radio, Send, Server } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AUTHOR_PROFILE, pickLocalized } from '@/data/author-profile'

export function WorkfolioFooter() {
  const t = useTranslations('Footer')
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale = parsedLocale.success ? parsedLocale.data : 'en'

  const [sseConnected, setSseConnected] = useState(false)
  const [latestEvent, setLatestEvent] = useState<TelemetryEvent | null>(null)

  useEffect(() => {
    let source: EventSource | null = null
    try {
      source = new EventSource('/api/telemetry/stream', {
        withCredentials: true,
      })

      source.onopen = () => {
        setSseConnected(true)
      }

      source.onmessage = (event) => {
        try {
          const parsedJson: unknown = JSON.parse(event.data as string)
          const validated = TelemetryEventSchema.safeParse(parsedJson)
          if (validated.success) {
            setLatestEvent(validated.data)
            setSseConnected(true)
          }
        } catch {
          // Ignore malformed event
        }
      }

      source.onerror = () => {
        setSseConnected(false)
      }
    } catch {
      setSseConnected(false)
    }

    return () => {
      source?.close()
    }
  }, [])

  return (
    <footer className="mt-16 border-t border-border/70 bg-muted/30 sm:mt-20">
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
              <Badge variant="outline" className="font-mono text-[11px]">
                v{APP_VERSION} (Lefthook Auto-Bump)
              </Badge>
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

          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-2 shadow-sm sm:flex-nowrap sm:gap-3 sm:px-3.5">
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
              />
              <Radio className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[11px] font-medium">{sseConnected ? 'SSE LIVE' : 'SSE STANDBY'}</span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground sm:max-w-md">
              {latestEvent ? (
                <>
                  <Activity className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate font-mono text-[11px]" title={latestEvent.message}>
                    {latestEvent.message}
                  </span>
                </>
              ) : (
                <>
                  <Server className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono text-[11px]">{t('waitingPulse')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
