'use client'

import {
  type SupportedLocale,
  type TelemetryEvent,
  type TelemetryEventType,
  TelemetryEventTypeEnum,
} from '@repo/shared-schemas'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui'
import { Activity, ArrowDownCircle, Radio, RefreshCw, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  formatSystemTimestamp,
  getTelemetryEventBadgeVariant,
  mergeLiveEventsWithPages,
  truncateUuid,
} from '../lib/system-status-helpers'
import { usePaginatedTelemetryEvents } from '../queries/use-system-observability'

type EventFilterValue = 'ALL' | TelemetryEventType

interface LiveEventLogCardProps {
  locale: SupportedLocale
  sseConnected: boolean
  recentLiveEvents: readonly TelemetryEvent[]
}

const EVENT_TYPE_OPTIONS: readonly EventFilterValue[] = ['ALL', ...TelemetryEventTypeEnum.options]

export function LiveEventLogCard({ locale, sseConnected, recentLiveEvents }: LiveEventLogCardProps) {
  const t = useTranslations('SystemStatusPage')
  const [eventTypeFilter, setEventTypeFilter] = useState<EventFilterValue>('ALL')

  const activeFilter = eventTypeFilter === 'ALL' ? undefined : eventTypeFilter
  const eventsQuery = usePaginatedTelemetryEvents({
    limit: 8,
    eventType: activeFilter,
  })

  const fetchedItems = eventsQuery.data?.pages.flatMap((page) => page.items) ?? []
  const lastPage = eventsQuery.data?.pages.at(-1)
  const nextCursor = lastPage?.nextCursor ?? null
  const { items: displayItems, liveIds } = mergeLiveEventsWithPages(recentLiveEvents, fetchedItems, activeFilter)

  const handleFilterChange = (value: string) => {
    if (!value) return
    if (value === 'ALL') {
      setEventTypeFilter('ALL')
      return
    }
    const parsed = TelemetryEventTypeEnum.safeParse(value)
    if (parsed.success) {
      setEventTypeFilter(parsed.data)
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono text-[10px]">
              useInfiniteQuery ➔ GET /api/telemetry/events
            </Badge>
            <Badge variant={sseConnected ? 'success' : 'warning'} className="font-mono text-[10px]">
              <Radio className="h-3 w-3" />
              <span>{sseConnected ? 'SSE LIVE' : 'SSE STANDBY'}</span>
            </Badge>
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-4 w-4 text-primary" />
            <span>{t('module2Title')}</span>
          </CardTitle>
          <CardDescription>{t('module2Subtitle')}</CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void eventsQuery.refetch()}
          disabled={eventsQuery.isFetching}
          className="shrink-0 gap-1.5 font-mono text-xs"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${eventsQuery.isFetching && !eventsQuery.isFetchingNextPage ? 'animate-spin' : ''}`}
          />
          <span>{t('refreshBtn')}</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter by eventType */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            value={eventTypeFilter}
            onValueChange={handleFilterChange}
            variant="outline"
            size="sm"
            aria-label={t('eventFilterAria')}
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option} value={option} className="font-mono text-[11px]">
                {option === 'ALL' ? t('filterAllEvents') : option}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <span className="font-mono text-[11px] text-muted-foreground">
            {t('loadedEventsCount', { count: displayItems.length })}
          </span>
        </div>

        {/* Event Log List / Table */}
        {eventsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, idx) => (
              <Skeleton key={`event-skeleton-${String(idx)}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : eventsQuery.isError && displayItems.length === 0 ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-xs text-muted-foreground">
            {t('eventsFetchError')}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center text-xs text-muted-foreground">
            {t('eventsEmptyState')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full min-w-[620px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-surface-subtle font-mono text-[11px] text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">{t('colEventType')}</th>
                  <th className="px-3 py-2.5 font-medium">{t('colEventMessage')}</th>
                  <th className="px-3 py-2.5 font-medium">{t('colEventContext')}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t('colEventTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {displayItems.map((item) => {
                  const isLiveHighlight = liveIds.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      className={
                        isLiveHighlight
                          ? 'bg-primary/5 transition-colors'
                          : 'bg-background transition-colors hover:bg-surface-subtle/60'
                      }
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getTelemetryEventBadgeVariant(item.type)} className="font-mono text-[10px]">
                            {item.type}
                          </Badge>
                          {isLiveHighlight ? (
                            <Badge variant="success" className="font-mono text-[10px]">
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>SSE</span>
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="max-w-md px-3 py-2.5 align-top font-mono text-[11px] text-foreground">
                        <span className="break-words">{item.message}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 align-top font-mono text-[11px] text-muted-foreground">
                        {item.slug ? (
                          <span>/{item.slug}</span>
                        ) : item.actorRole ? (
                          <span>{item.actorRole}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right align-top font-mono text-[11px] text-muted-foreground">
                        {formatSystemTimestamp(item.createdAt, locale)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{t('nextCursorLabel')}:</span>
          {nextCursor ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-help font-mono text-[11px]">
                  {truncateUuid(nextCursor)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-[11px]">
                {nextCursor}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>{t('cursorEndReached')}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!eventsQuery.hasNextPage || eventsQuery.isFetchingNextPage}
          onClick={() => void eventsQuery.fetchNextPage()}
          className="gap-1.5 font-mono text-xs"
        >
          <ArrowDownCircle className="h-3.5 w-3.5" />
          <span>
            {eventsQuery.isFetchingNextPage
              ? t('loadingOlderEvents')
              : eventsQuery.hasNextPage
                ? t('loadOlderEventsBtn')
                : t('noOlderEventsBtn')}
          </span>
        </Button>
      </CardFooter>
    </Card>
  )
}
