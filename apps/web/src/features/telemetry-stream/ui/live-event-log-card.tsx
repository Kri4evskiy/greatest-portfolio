'use client'

import {
  API_ENDPOINTS,
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
import { Activity, ArrowDownCircle, Radio, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { mergeLiveEventsWithPages, truncateUuid } from '../lib/system-status-helpers'
import { usePaginatedTelemetryEvents } from '../queries/use-system-observability'
import { createLiveEventLogColumns } from './table/live-event-log-columns'
import { ObservabilityDataTable } from './table/observability-data-table'

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
  const {
    data: eventsData,
    isLoading,
    isError,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = usePaginatedTelemetryEvents({
    limit: 8,
    eventType: activeFilter,
  })

  const fetchedItems = useMemo(() => eventsData?.pages.flatMap((page) => page.items) ?? [], [eventsData])
  const lastPage = eventsData?.pages.at(-1)
  const nextCursor = lastPage?.nextCursor ?? null
  const { items: displayItems, liveIds } = useMemo(
    () => mergeLiveEventsWithPages(recentLiveEvents, fetchedItems, activeFilter),
    [activeFilter, fetchedItems, recentLiveEvents],
  )

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

  const columns = useMemo(
    () =>
      createLiveEventLogColumns({
        locale,
        liveIds,
        labels: {
          eventType: t('colEventType'),
          eventMessage: t('colEventMessage'),
          eventContext: t('colEventContext'),
          eventTime: t('colEventTime'),
        },
      }),
    [liveIds, locale, t],
  )

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono text-[10px]">
              {`useInfiniteQuery ➔ GET ${API_ENDPOINTS.telemetryEvents}`}
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
          onClick={() => void refetch()}
          disabled={isFetching}
          className="shrink-0 gap-1.5 font-mono text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching && !isFetchingNextPage ? 'animate-spin' : ''}`} />
          <span>{t('refreshBtn')}</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
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

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, idx) => (
              <Skeleton key={`event-skeleton-${String(idx)}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError && displayItems.length === 0 ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-xs text-muted-foreground">
            {t('eventsFetchError')}
          </div>
        ) : (
          <ObservabilityDataTable
            data={displayItems}
            columns={columns}
            emptyState={t('eventsEmptyState')}
            minTableWidthClass="min-w-[620px]"
            tableTestId="live-events-table"
            getRowId={(row) => row.id}
            getRowClassName={(row) =>
              liveIds.has(row.id)
                ? 'bg-primary/5 transition-colors'
                : 'bg-background transition-colors hover:bg-surface-subtle/60'
            }
          />
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
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => void fetchNextPage()}
          className="gap-1.5 font-mono text-xs"
        >
          <ArrowDownCircle className="h-3.5 w-3.5" />
          <span>
            {isFetchingNextPage
              ? t('loadingOlderEvents')
              : hasNextPage
                ? t('loadOlderEventsBtn')
                : t('noOlderEventsBtn')}
          </span>
        </Button>
      </CardFooter>
    </Card>
  )
}
