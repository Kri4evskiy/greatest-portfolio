import { API_ENDPOINTS } from '@repo/shared-schemas'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import * as analytics from '@/shared/lib/analytics'
import { apiClient, isCancelledRequestError } from '@/shared/lib/api-client'
import { makeQueryClient, QueryProvider } from '../query-provider'

const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

afterAll(() => {
  server.close()
})

function QueryProbe({ endpoint }: { endpoint: typeof API_ENDPOINTS.health }) {
  const query = useQuery({
    queryKey: ['probe', endpoint],
    queryFn: ({ signal }) => apiClient.get(endpoint, z.object({ status: z.string() }), { signal }),
    retryDelay: 0,
  })
  return (
    <div data-status={query.status} data-fetch-status={query.fetchStatus}>
      {query.error ? query.error.message : 'ok'}
    </div>
  )
}

describe('QueryProvider / makeQueryClient error & retry policy', () => {
  it('does not retry 4xx ApiClientError and suppresses captureClientException', async () => {
    const captureSpy = vi.spyOn(analytics, 'captureClientException').mockImplementation(() => undefined)
    let callCount = 0

    server.use(
      http.get('http://localhost:3000/api/health', () => {
        callCount += 1
        return HttpResponse.json(
          { message: 'Unauthorized guest session' },
          { status: 401, headers: { 'X-Request-Id': 'req-401' } },
        )
      }),
    )

    const client = makeQueryClient()
    const { container } = render(
      <QueryClientProvider client={client}>
        <QueryProbe endpoint={API_ENDPOINTS.health} />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(container.firstElementChild?.getAttribute('data-status')).toBe('error')
    })

    expect(callCount).toBe(1)
    expect(captureSpy).not.toHaveBeenCalled()
  })

  it('suppresses captureClientException when an in-flight query is cancelled on unmount (StrictMode simulation)', async () => {
    const captureSpy = vi.spyOn(analytics, 'captureClientException').mockImplementation(() => undefined)
    let seenError: unknown
    let requestStarted = false

    const client = makeQueryClient()
    const originalOnError = client.getQueryCache().config.onError
    client.getQueryCache().config.onError = (error, query) => {
      seenError = error
      originalOnError?.(error, query)
    }

    server.use(
      http.get('http://localhost:3000/api/health', async ({ request }) => {
        requestStarted = true
        await new Promise<void>((resolve) => {
          request.signal.addEventListener('abort', () => resolve(), { once: true })
          setTimeout(resolve, 200)
        })
        return HttpResponse.json({ status: 'ok' })
      }),
    )

    const { unmount } = render(
      <QueryClientProvider client={client}>
        <QueryProbe endpoint={API_ENDPOINTS.health} />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(requestStarted).toBe(true)
    })

    // Unmounting mid-flight triggers TanStack Query's AbortSignal cancellation
    unmount()
    await client.cancelQueries({ queryKey: ['probe', API_ENDPOINTS.health] })

    await waitFor(() => {
      expect(client.isFetching()).toBe(0)
    })

    if (seenError !== undefined) {
      expect(isCancelledRequestError(seenError)).toBe(true)
    }
    expect(captureSpy).not.toHaveBeenCalled()
  })

  it('retries 5xx ApiClientError once and forwards final failure with status & requestId to captureClientException', async () => {
    const captureSpy = vi.spyOn(analytics, 'captureClientException').mockImplementation(() => undefined)
    let callCount = 0

    server.use(
      http.get('http://localhost:3000/api/health', () => {
        callCount += 1
        return HttpResponse.json(
          { message: 'Internal database timeout' },
          { status: 500, headers: { 'X-Request-Id': 'req-500-trace' } },
        )
      }),
    )

    const client = makeQueryClient()
    const { container } = render(
      <QueryClientProvider client={client}>
        <QueryProbe endpoint={API_ENDPOINTS.health} />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(container.firstElementChild?.getAttribute('data-status')).toBe('error')
    })

    expect(callCount).toBe(2)
    expect(captureSpy).toHaveBeenCalledTimes(1)
    expect(captureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, requestId: 'req-500-trace' }),
      expect.objectContaining({
        source: 'QueryCache.onError',
        status: 500,
        requestId: 'req-500-trace',
      }),
    )
  })

  it('mounts QueryProvider gracefully in jsdom even when IndexedDB is unavailable', async () => {
    render(
      <QueryProvider>
        <div data-testid="provider-child">ready</div>
      </QueryProvider>,
    )

    expect(await screen.findByTestId('provider-child')).toHaveTextContent('ready')
  })
})
