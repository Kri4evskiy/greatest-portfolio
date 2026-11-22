'use client'

import { API_ENDPOINTS, type SupportedLocale } from '@repo/shared-schemas'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui'
import { Bot, Cpu, Database, HardDrive, Lock, Network, RefreshCw, Server, ShieldCheck, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ArchitectureNodeId, buildArchitectureNodes, formatSystemTimestamp } from '../lib/system-status-helpers'
import { useSystemCapabilities, useTelemetryStats } from '../queries/use-system-observability'

const NODE_ICONS: Record<ArchitectureNodeId, typeof Server> = {
  'edge-proxy': ShieldCheck,
  'nestjs-api': Server,
  persistence: Database,
  'telemetry-tcp': Network,
  'redis-cache': Zap,
  's3-storage': HardDrive,
  'telegram-auth': Bot,
}

export function CapabilitiesMatrixCard({ locale }: { locale: SupportedLocale }) {
  const t = useTranslations('SystemStatusPage')
  const capabilitiesQuery = useSystemCapabilities()
  const statsQuery = useTelemetryStats()

  const isLoading = capabilitiesQuery.isLoading
  const isFetching = capabilitiesQuery.isFetching || statsQuery.isFetching
  const capabilities = capabilitiesQuery.data
  const stats = statsQuery.data

  const handleRefresh = () => {
    void capabilitiesQuery.refetch()
    void statsQuery.refetch()
  }

  const nodes = capabilities ? buildArchitectureNodes(capabilities, stats?.totalEventsProcessed) : []

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono text-[10px]">
              {`GET ${API_ENDPOINTS.capabilities} + ${API_ENDPOINTS.telemetryStats}`}
            </Badge>
            {capabilities ? (
              <Badge
                variant={capabilities.persistence === 'postgresql' ? 'success' : 'warning'}
                className="font-mono text-[10px]"
              >
                {capabilities.persistence === 'postgresql' ? t('persistencePostgres') : t('persistenceMemory')}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cpu className="h-4 w-4 text-primary" />
            <span>{t('module1Title')}</span>
          </CardTitle>
          <CardDescription>{t('module1Subtitle')}</CardDescription>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {capabilities ? (
            <span className="font-mono text-[11px] text-muted-foreground">
              {t('updatedAtLabel')} {formatSystemTimestamp(capabilities.timestamp, locale)}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-1.5 font-mono text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{t('refreshBtn')}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 7 }, (_, idx) => (
              <div key={`node-skeleton-${String(idx)}`} className="space-y-2.5 rounded-lg border border-border/70 p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : capabilitiesQuery.isError ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
            <p className="font-medium">{t('apiOfflineTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('apiOfflineHint')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {nodes.map((node) => {
                const Icon = NODE_ICONS[node.id]
                const statusBadgeText =
                  node.statusKind === 'online'
                    ? t('statusOnline')
                    : node.statusKind === 'fallback'
                      ? t('statusFallback')
                      : t('statusCapabilityGated')

                return (
                  <div
                    key={node.id}
                    className={`flex flex-col justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                      node.capabilityGated
                        ? 'border-dashed border-border bg-surface-subtle/70'
                        : 'border-border/80 bg-background'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface-subtle text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm font-semibold leading-tight text-foreground">
                            {t(`nodes.${node.id}.title`)}
                          </span>
                        </div>
                        {node.capabilityGated ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={t('capabilityGatedTooltip')}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-warning/30 bg-warning/10 text-warning focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40"
                              >
                                <Lock className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{t('capabilityGatedTooltip')}</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>

                      <p className="text-xs leading-relaxed text-muted-foreground">{t(`nodes.${node.id}.desc`)}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <Badge variant={node.badgeVariant} className="font-mono text-[10px]">
                        {statusBadgeText}
                      </Badge>
                      {node.metaValue ? (
                        <span className="font-mono text-[11px] text-muted-foreground">{node.metaValue}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {capabilities ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface-subtle px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    {t('rateLimiterLabel')}: <strong className="text-foreground">{capabilities.rateLimiter}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {t('sentryLabel')}:{' '}
                    <strong className="text-foreground">
                      {capabilities.integrations.sentryObservability ? t('configured') : t('noApiKeyShort')}
                    </strong>
                  </span>
                </div>
                <span>
                  {t('tcpProcessedLabel')}:{' '}
                  <strong className="text-foreground">{stats?.totalEventsProcessed ?? 0}</strong>
                </span>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
