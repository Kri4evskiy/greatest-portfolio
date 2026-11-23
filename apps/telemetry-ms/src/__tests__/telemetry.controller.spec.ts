import { randomUUID } from 'node:crypto'
import { Logger } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TelemetryMicroserviceController } from '../telemetry.controller'

describe('TelemetryMicroserviceController (TCP @EventPattern & @MessagePattern)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('drops invalid telemetry payloads safely without incrementing counters', () => {
    const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    const controller = new TelemetryMicroserviceController()

    expect(controller.handleTelemetryEvent({ invalid: true })).toBeNull()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(controller.getStats()).toMatchObject({
      totalEventsProcessed: 0,
      recentEvents: [],
    })
  })

  it('stores validated events newest-first, bounds history to 50, and exposes latest 10 in getStats()', () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const controller = new TelemetryMicroserviceController()

    for (let i = 1; i <= 55; i += 1) {
      const result = controller.handleTelemetryEvent({
        id: randomUUID(),
        type: 'ARTICLE_VIEWED',
        message: `Article view #${i}`,
        slug: `slug-${i}`,
        timestamp: '2026-11-23T12:00:00.000Z',
      })
      expect(result?.message).toBe(`Article view #${i}`)
    }

    const stats = controller.getStats()
    expect(stats.totalEventsProcessed).toBe(55)
    expect(stats.recentEvents).toHaveLength(10)
    expect(stats.recentEvents[0]?.message).toBe('Article view #55')
    expect(stats.recentEvents.at(-1)?.message).toBe('Article view #46')
    expect(stats.uptimeSeconds).toBeGreaterThanOrEqual(0)
  })
})
