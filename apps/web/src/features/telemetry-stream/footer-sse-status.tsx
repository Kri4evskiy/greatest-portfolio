'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { Activity, Radio, Server } from 'lucide-react'
import { useTelemetryStream } from './use-telemetry-stream'

export function FooterSseStatus({ waitingLabel }: { waitingLabel: string }) {
  const { sseConnected, latestEvent } = useTelemetryStream()

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-2 shadow-xs sm:flex-nowrap sm:gap-3 sm:px-3.5">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${sseConnected ? 'animate-pulse bg-success' : 'bg-warning'}`} />
        <Radio className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[11px] font-medium">{sseConnected ? 'SSE LIVE' : 'SSE STANDBY'}</span>
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
    </div>
  )
}
