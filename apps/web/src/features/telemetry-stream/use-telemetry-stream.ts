'use client'

import { API_ENDPOINTS, type TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas'
import { useSyncExternalStore } from 'react'

export interface TelemetryStreamSnapshot {
  readonly sseConnected: boolean
  readonly latestEvent: TelemetryEvent | null
  readonly recentEvents: readonly TelemetryEvent[]
}

const SERVER_SNAPSHOT: TelemetryStreamSnapshot = {
  sseConnected: false,
  latestEvent: null,
  recentEvents: [],
}

const MAX_RECENT_EVENTS = 15
const BASE_RECONNECT_DELAY_MS = 2_000
const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_CLOSED_RECONNECT_ATTEMPTS = 6

/**
 * Single ref-counted EventSource manager shared across all mounted React consumers
 * (e.g. `FooterSseStatus` + `SystemStatusDashboard`).
 *
 * Why a shared singleton manager instead of per-hook `new EventSource()`:
 * 1. Free-Tier & HTTP/1.1 Protection: opening 1 SSE connection per tab instead of 2+
 *    respects our backend's strict `MAX_SSE_STREAMS_PER_IP = 2` cap and avoids saturating
 *    the browser's 6-connection-per-origin HTTP/1.1 limit when multiple tabs are open.
 * 2. Resilient Reconnect on `EventSource.CLOSED`: native EventSource stops reconnecting
 *    permanently after 429/500 proxy errors or our backend's 15-minute max stream TTL.
 *    Bounded exponential backoff (2s -> 30s, max 6 retries, reset on `online` / `pageshow`)
 *    recovers cleanly without creating reconnect storms on free-tier hosts.
 * 3. bfcache Hygiene: closes the socket on `pagehide` and restores it cleanly on `pageshow`.
 */
class SharedTelemetryStreamManager {
  private snapshot: TelemetryStreamSnapshot = SERVER_SNAPSHOT
  private readonly listeners = new Set<() => void>()
  private source: EventSource | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private windowListenersAttached = false

  getSnapshot = (): TelemetryStreamSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    if (typeof window !== 'undefined' && this.listeners.size === 1) {
      this.attachWindowListeners()
      this.connect()
    }

    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) {
        this.teardown()
      }
    }
  }

  private emitSnapshot(next: TelemetryStreamSnapshot): void {
    this.snapshot = next
    for (const listener of this.listeners) {
      listener()
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private closeSource(): void {
    if (this.source) {
      this.source.close()
      this.source = null
    }
  }

  private scheduleReconnect(): void {
    if (this.listeners.size === 0 || this.reconnectTimer !== null) {
      return
    }
    if (this.reconnectAttempts >= MAX_CLOSED_RECONNECT_ATTEMPTS) {
      return
    }

    const delayMs = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS)
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.listeners.size > 0) {
        this.connect()
      }
    }, delayMs)
  }

  private connect(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return
    }

    this.clearReconnectTimer()
    this.closeSource()

    try {
      const nextSource = new EventSource(API_ENDPOINTS.telemetryStream, {
        withCredentials: true,
      })
      this.source = nextSource

      nextSource.onopen = () => {
        this.reconnectAttempts = 0
        if (!this.snapshot.sseConnected) {
          this.emitSnapshot({
            ...this.snapshot,
            sseConnected: true,
          })
        }
      }

      nextSource.onmessage = (event) => {
        try {
          const parsedJson: unknown = JSON.parse(String(event.data))
          const validated = TelemetryEventSchema.safeParse(parsedJson)
          if (validated.success) {
            const incoming = validated.data
            this.reconnectAttempts = 0
            this.emitSnapshot({
              sseConnected: true,
              latestEvent: incoming,
              recentEvents: [incoming, ...this.snapshot.recentEvents.filter((item) => item.id !== incoming.id)].slice(
                0,
                MAX_RECENT_EVENTS,
              ),
            })
          }
        } catch {
          // Ignore malformed SSE payload
        }
      }

      nextSource.onerror = () => {
        if (this.snapshot.sseConnected) {
          this.emitSnapshot({
            ...this.snapshot,
            sseConnected: false,
          })
        }

        // If the browser permanently closed EventSource (e.g. 429/500 or 15m server TTL),
        // schedule a bounded exponential backoff reconnect instead of stalling in STANDBY.
        if (nextSource.readyState === EventSource.CLOSED) {
          this.closeSource()
          this.scheduleReconnect()
        }
      }
    } catch {
      if (this.snapshot.sseConnected) {
        this.emitSnapshot({
          ...this.snapshot,
          sseConnected: false,
        })
      }
      this.scheduleReconnect()
    }
  }

  private readonly handlePageHide = (): void => {
    this.clearReconnectTimer()
    this.closeSource()
    if (this.snapshot.sseConnected) {
      this.emitSnapshot({
        ...this.snapshot,
        sseConnected: false,
      })
    }
  }

  private readonly handlePageShow = (event: PageTransitionEvent): void => {
    if (event.persisted && this.listeners.size > 0) {
      this.reconnectAttempts = 0
      this.connect()
    }
  }

  private readonly handleOnline = (): void => {
    if (this.listeners.size > 0 && (!this.source || this.source.readyState === EventSource.CLOSED)) {
      this.reconnectAttempts = 0
      this.connect()
    }
  }

  private attachWindowListeners(): void {
    if (this.windowListenersAttached || typeof window === 'undefined') {
      return
    }
    window.addEventListener('pagehide', this.handlePageHide)
    window.addEventListener('pageshow', this.handlePageShow)
    window.addEventListener('online', this.handleOnline)
    this.windowListenersAttached = true
  }

  private detachWindowListeners(): void {
    if (!this.windowListenersAttached || typeof window === 'undefined') {
      return
    }
    window.removeEventListener('pagehide', this.handlePageHide)
    window.removeEventListener('pageshow', this.handlePageShow)
    window.removeEventListener('online', this.handleOnline)
    this.windowListenersAttached = false
  }

  private teardown(): void {
    this.clearReconnectTimer()
    this.closeSource()
    this.detachWindowListeners()
    this.reconnectAttempts = 0
    if (this.snapshot.sseConnected) {
      this.snapshot = {
        ...this.snapshot,
        sseConnected: false,
      }
    }
  }
}

const sharedTelemetryManager = new SharedTelemetryStreamManager()

export function useTelemetryStream(): TelemetryStreamSnapshot {
  return useSyncExternalStore(
    sharedTelemetryManager.subscribe,
    sharedTelemetryManager.getSnapshot,
    () => SERVER_SNAPSHOT,
  )
}
