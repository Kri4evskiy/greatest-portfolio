'use client'

import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { Activity, ArrowUpRight, Radio, Server } from 'lucide-react'
import { Link } from '@/shared/i18n/navigation'
import { useTelemetryStream } from './use-telemetry-stream'

interface FooterSseStatusProps {
  waitingLabel: string
  inspectLabel?: string
}

export function FooterSseStatus({ waitingLabel, inspectLabel = 'Inspect Live API' }: FooterSseStatusProps) {
  const { sseConnected, latestEvent } = useTelemetryStream()

  return (
    <Link
      href="/system-status"
      aria-label={`${sseConnected ? 'SSE LIVE' : 'SSE STANDBY'} — ${inspectLabel}`}
      className="group flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-2 shadow-xs transition-colors hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-nowrap sm:gap-3 sm:px-3.5"
    >
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${sseConnected ? 'animate-pulse bg-success' : 'bg-warning'}`} />
        <Radio className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[11px] font-medium text-foreground">
          {sseConnected ? 'SSE LIVE' : 'SSE STANDBY'}
        </span>
      </div>
      <div className="hidden h-4 w-px bg-border sm:block" />
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground sm:max-w-md">
        {latestEvent ? (
          <>
            <Activity className="h-3.5 w-3.5 shrink-0 text-success" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate font-mono text-[11px]">{latestEvent.message}</span>
              </TooltipTrigger>
              <TooltipContent side="top">{latestEvent.message}</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Server className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-mono text-[11px]">{waitingLabel}</span>
          </>
        )}
      </div>
      <Badge
        variant="outline"
        className="ml-auto shrink-0 border-primary/30 bg-primary/5 font-mono text-[10px] text-primary transition-colors group-hover:border-primary group-hover:bg-primary/10"
      >
        <span>{inspectLabel}</span>
        <ArrowUpRight className="h-3 w-3" />
      </Badge>
    </Link>
  )
}
