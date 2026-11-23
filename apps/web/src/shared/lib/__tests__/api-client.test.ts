import { API_ENDPOINTS, SystemCapabilitiesSchema } from '@repo/shared-schemas'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  ApiClientError,
  apiClient,
  compactQueryParams,
  DEFAULT_REQUEST_TIMEOUT_MS,
  isCancelledRequestError,
} from '../api-client'

const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('compactQueryParams', () => {
  it('returns undefined when params are omitted', () => {
    expect(compactQueryParams(undefined)).toBeUndefined()
  })

  it('strips null, undefined, and empty strings while preserving 0, false, and valid values', () => {
    expect(
      compactQueryParams({
        cursor: null,
        category: undefined,
        search: '',
        limit: 0,
        onlyActive: false,
        sortBy: 'viewsCount',
      }),
    ).toEqual({
      limit: 0,
      onlyActive: false,
      sortBy: 'viewsCount',
    })
  })
})

describe('apiClient (Axios instance & interceptors)', () => {
  it('enforces withCredentials, allowAbsoluteUrls: false, 16_000ms timeout, and omits null/empty query params', async () => {
    let capturedUrl = ''
    let capturedAllowAbsoluteUrls: boolean | undefined
    let capturedWithCredentials: boolean | undefined
    let capturedTimeout: number | undefined

    const interceptorId = apiClient.interceptors.request.use((config) => {
      capturedAllowAbsoluteUrls = config.allowAbsoluteUrls
      capturedWithCredentials = config.withCredentials
      capturedTimeout = config.timeout
      return config
    })

    server.use(
      http.get('http://localhost:3000/api/capabilities', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({
          status: 'ok',
          mode: 'demo',
          persistence: 'in-memory-fallback',
          rateLimiter: 'in-memory',
          telemetryTcpConnected: false,
          integrations: {
            redisCache: false,
            s3ObjectStorage: false,
            telegramBotAuth: false,
            sentryObservability: false,
          },
          timestamp: '2026-11-23T10:00:00.000Z',
        })
      }),
    )

    try {
      const result = await apiClient.get(API_ENDPOINTS.capabilities, SystemCapabilitiesSchema, {
        params: {
          cursor: null,
          eventType: undefined,
          empty: '',
          limit: 10,
        },
      })

      expect(result.status).toBe('ok')
      expect(DEFAULT_REQUEST_TIMEOUT_MS).toBe(16_000)
      expect(capturedAllowAbsoluteUrls).toBe(false)
      expect(capturedWithCredentials).toBe(true)
      expect(capturedTimeout).toBe(16_000)
      expect(capturedUrl).toBe('http://localhost:3000/api/capabilities?limit=10')
    } finally {
      apiClient.interceptors.request.eject(interceptorId)
    }
  })

  it('handles 204 No Content responses cleanly without JSON parse failures', async () => {
    server.use(
      http.delete('http://localhost:3000/api/health', () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(apiClient.delete(API_ENDPOINTS.health, z.undefined())).resolves.toBeUndefined()
  })

  it('normalizes NestJS error payloads (string & string[]) and X-Request-Id into ApiClientError', async () => {
    server.use(
      http.get('http://localhost:3000/api/telemetry/events', () => {
        return HttpResponse.json(
          { message: ['cursor must be a UUID', 'limit must not exceed 50'] },
          {
            status: 400,
            headers: { 'X-Request-Id': 'req-abc-123' },
          },
        )
      }),
    )

    await expect(apiClient.get(API_ENDPOINTS.telemetryEvents, z.unknown())).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 400,
      requestId: 'req-abc-123',
      message: 'cursor must be a UUID, limit must not exceed 50',
    })
  })

  it('normalizes network failures into ApiClientError with status 0', async () => {
    server.use(
      http.get('http://localhost:3000/api/health', () => {
        return HttpResponse.error()
      }),
    )

    let caught: unknown
    try {
      await apiClient.get(API_ENDPOINTS.health, z.unknown())
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(ApiClientError)
    expect((caught as ApiClientError).status).toBe(0)
  })

  it('preserves cancellation errors without wrapping them in ApiClientError', async () => {
    const controller = new AbortController()
    controller.abort()

    server.use(
      http.get('http://localhost:3000/api/health', () => {
        return HttpResponse.json({ status: 'ok' })
      }),
    )

    let caught: unknown
    try {
      await apiClient.get(API_ENDPOINTS.health, z.unknown(), { signal: controller.signal })
    } catch (error) {
      caught = error
    }

    expect(caught).not.toBeInstanceOf(ApiClientError)
    expect(isCancelledRequestError(caught)).toBe(true)
  })
})
