'use client'

import { type TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas'
import { useEffect, useState } from 'react'

export function useTelemetryStream() {
  const [sseConnected, setSseConnected] = useState(false)
  const [latestEvent, setLatestEvent] = useState<TelemetryEvent | null>(null)
  const [recentEvents, setRecentEvents] = useState<TelemetryEvent[]>([])

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
              const incoming = validated.data
              setLatestEvent(incoming)
              setRecentEvents((prev) => [incoming, ...prev.filter((item) => item.id !== incoming.id)].slice(0, 15))
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

  return {
    sseConnected,
    latestEvent,
    recentEvents,
  }
}
