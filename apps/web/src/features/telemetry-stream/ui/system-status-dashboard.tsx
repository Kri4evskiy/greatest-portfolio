'use client'

import type { SupportedLocale } from '@repo/shared-schemas'
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui'
import { Activity, ArrowLeft, Radio, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/shared/i18n/navigation'
import { useTelemetryStream } from '../use-telemetry-stream'
import { CapabilitiesMatrixCard } from './capabilities-matrix-card'
import { KnowledgeLeaderboardCard } from './knowledge-leaderboard-card'
import { LiveEventLogCard } from './live-event-log-card'

type InspectorTab = 'all' | 'capabilities' | 'events' | 'leaderboard'

export function SystemStatusDashboard({ locale }: { locale: SupportedLocale }) {
  const t = useTranslations('SystemStatusPage')
  const { sseConnected, recentEvents } = useTelemetryStream()

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header / SSG Hero Shell */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('backToWorkfolio')}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span>{t('readOnlyBadge')}</span>
            </Badge>
            <Badge variant={sseConnected ? 'success' : 'warning'} className="font-mono text-[10px]">
              <Radio className="h-3 w-3" />
              <span>{sseConnected ? 'SSE LIVE' : 'SSE STANDBY'}</span>
            </Badge>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-primary">
            <Activity className="h-4 w-4" />
            <span>/[locale]/system-status</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('heroTitle')}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('heroSubtitle')}</p>
        </div>
      </div>

      {/* Interactive Inspector Tabs */}
      <Tabs defaultValue={'all' satisfies InspectorTab} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">{t('tabAll')}</TabsTrigger>
          <TabsTrigger value="capabilities">{t('tabCapabilities')}</TabsTrigger>
          <TabsTrigger value="events">{t('tabEvents')}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t('tabLeaderboard')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <CapabilitiesMatrixCard locale={locale} />
          <LiveEventLogCard locale={locale} sseConnected={sseConnected} recentLiveEvents={recentEvents} />
          <KnowledgeLeaderboardCard locale={locale} />
        </TabsContent>

        <TabsContent value="capabilities">
          <CapabilitiesMatrixCard locale={locale} />
        </TabsContent>

        <TabsContent value="events">
          <LiveEventLogCard locale={locale} sseConnected={sseConnected} recentLiveEvents={recentEvents} />
        </TabsContent>

        <TabsContent value="leaderboard">
          <KnowledgeLeaderboardCard locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
