'use client'

import { type TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas'
import { Activity, Radio, Server } from 'lucide-react'
import { useEffect, useState } from 'react'

export function FooterSseStatus({ waitingLabel }: { waitingLabel: string }) {
  const [sseConnected, setSseConnected] = useState(false)
  const [latestEvent, setLatestEvent] = useState<TelemetryEvent | null>(null)

  useEffect(() => {
    let source: EventSource | null = null

    const connect = () => {
      source?.close()
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
    }

    const handlePageHide = () => {
      source?.close()
      source = null
      setSseConnected(false)
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        connect()
      }
    }

    connect()
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
      source?.close()
    }
  }, [])

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-2 shadow-sm sm:flex-nowrap sm:gap-3 sm:px-3.5">
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
            <span className="truncate font-mono text-[11px]" title={latestEvent.message}>
              {latestEvent.message}
            </span>
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
