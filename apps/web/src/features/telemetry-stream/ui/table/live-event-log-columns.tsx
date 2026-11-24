'use client'

import type { SupportedLocale, SystemEventLogItem } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { Sparkles } from 'lucide-react'
import { formatSystemTimestamp, getTelemetryEventBadgeVariant } from '../../lib/system-status-helpers'
import type { ObservabilityColumnDef } from './observability-data-table'

export interface LiveEventLogColumnLabels {
  eventType: string
  eventMessage: string
  eventContext: string
  eventTime: string
}

interface CreateLiveEventLogColumnsParams {
  locale: SupportedLocale
  liveIds: ReadonlySet<string>
  labels: LiveEventLogColumnLabels
}

export function createLiveEventLogColumns({
  locale,
  liveIds,
  labels,
}: CreateLiveEventLogColumnsParams): ObservabilityColumnDef<SystemEventLogItem>[] {
  return [
    {
      accessorKey: 'type',
      header: () => labels.eventType,
      meta: {
        cellClassName: 'whitespace-nowrap px-3 py-2.5 align-top',
      },
      cell: ({ row }) => {
        const item = row.original
        const isLiveHighlight = liveIds.has(item.id)
        return (
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
        )
      },
    },
    {
      accessorKey: 'message',
      header: () => labels.eventMessage,
      meta: {
        cellClassName: 'max-w-md px-3 py-2.5 align-top font-mono text-[11px] text-foreground',
      },
      cell: ({ row }) => <span className="break-words">{row.original.message}</span>,
    },
    {
      id: 'context',
      header: () => labels.eventContext,
      meta: {
        cellClassName: 'whitespace-nowrap px-3 py-2.5 align-top font-mono text-[11px] text-muted-foreground',
      },
      cell: ({ row }) => {
        const item = row.original
        if (item.slug) return <span>/{item.slug}</span>
        if (item.actorRole) return <span>{item.actorRole}</span>
        return <span>—</span>
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => labels.eventTime,
      meta: {
        headerClassName: 'px-3 py-2.5 text-right font-medium',
        cellClassName: 'whitespace-nowrap px-3 py-2.5 text-right align-top font-mono text-[11px] text-muted-foreground',
      },
      cell: ({ row }) => formatSystemTimestamp(row.original.createdAt, locale),
    },
  ]
}
