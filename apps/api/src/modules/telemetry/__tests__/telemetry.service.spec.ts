import { HttpException, ServiceUnavailableException } from '@nestjs/common'
import type { ClientProxy } from '@nestjs/microservices'
import { throwError } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../../prisma/prisma.service.js'
import { MAX_SSE_STREAMS_PER_IP, TelemetryService } from '../telemetry.service.js'

describe('TelemetryService (SSE capacity limits, async emit safety & monotonic counter)', () => {
  it('handles async ClientProxy.emit errors gracefully and tracks monotonic local event count', async () => {
    const mockClient = {
      emit: vi.fn(() => throwError(() => new Error('ECONNREFUSED'))),
      send: vi.fn(() => throwError(() => new Error('ECONNREFUSED'))),
      close: vi.fn(async () => undefined),
    } as unknown as ClientProxy

    const prisma = new PrismaService()
    const service = new TelemetryService(mockClient, prisma)

    for (let i = 0; i < 30; i += 1) {
      await service.publishEvent({
        type: 'ARTICLE_VIEWED',
        message: `Event ${i}`,
      })
    }

    const stats = await service.getMicroserviceStats()
    expect(stats.microserviceConnected).toBe(false)
    // Monotonic counter keeps counting past recentEvents ring-buffer cap (25)
    expect(stats.totalEventsProcessed).toBe(30)
    expect(stats.recentEvents).toHaveLength(5)

    await service.onModuleDestroy()
  })

  it('enforces per-IP SSE connection cap and releases slots on unsubscribe', async () => {
    const mockClient = {
      emit: vi.fn(() => throwError(() => new Error('offline'))),
      send: vi.fn(() => throwError(() => new Error('offline'))),
      close: vi.fn(async () => undefined),
    } as unknown as ClientProxy

    const prisma = new PrismaService()
    const service = new TelemetryService(mockClient, prisma)

    const subs = []
    for (let i = 0; i < MAX_SSE_STREAMS_PER_IP; i += 1) {
      subs.push(service.getEventStream('203.0.113.10').subscribe())
    }

    expect(() => service.getEventStream('203.0.113.10')).toThrow(HttpException)
    expect(service.getAdminDiagnostics().activeSseStreams).toBe(MAX_SSE_STREAMS_PER_IP)

    // Unsubscribing releases the slot so a new connection from the same IP succeeds
    subs[0]?.unsubscribe()
    expect(service.getAdminDiagnostics().activeSseStreams).toBe(MAX_SSE_STREAMS_PER_IP - 1)

    const reconnected = service.getEventStream('203.0.113.10').subscribe()
    expect(service.getAdminDiagnostics().activeSseStreams).toBe(MAX_SSE_STREAMS_PER_IP)

    // Different IP still succeeds under global cap
    const otherIp = service.getEventStream('203.0.113.11').subscribe()
    expect(service.getAdminDiagnostics().activeSseStreams).toBe(MAX_SSE_STREAMS_PER_IP + 1)

    for (const sub of [...subs, reconnected, otherIp]) {
      sub.unsubscribe()
    }
    expect(service.getAdminDiagnostics().activeSseStreams).toBe(0)
    expect(ServiceUnavailableException).toBeDefined()

    await service.onModuleDestroy()
  })
})
