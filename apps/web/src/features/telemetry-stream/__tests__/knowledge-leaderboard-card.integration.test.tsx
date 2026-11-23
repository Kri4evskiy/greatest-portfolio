import type { ArticleMeta } from '@repo/shared-schemas'
import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { NextIntlClientProvider } from 'next-intl'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { makeQueryClient } from '@/shared/providers/query-provider'
import enMessages from '../../../../messages/en.json'
import { KnowledgeLeaderboardCard } from '../ui/knowledge-leaderboard-card'

const ALL_METRICS: readonly ArticleMeta[] = [
  {
    slug: 'this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki',
    category: 'this-project',
    viewsCount: 214,
    helpfulCount: 72,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'react-18-vs-19-compiler-d3',
    category: 'react',
    viewsCount: 198,
    helpfulCount: 64,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'this-project--frontend-architecture--edge-web-crypto-jwt-proxy',
    category: 'this-project',
    viewsCount: 184,
    helpfulCount: 59,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'databases-sql--indexing--database-indexing-deep-dive',
    category: 'databases-sql',
    viewsCount: 175,
    helpfulCount: 55,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'nestjs-jwt-httponly-prisma-sse',
    category: 'nestjs-prisma',
    viewsCount: 167,
    helpfulCount: 51,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'strict-typescript-zod-contracts',
    category: 'typescript',
    viewsCount: 156,
    helpfulCount: 47,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'nestjs--ai-mcp--nestjs-ai-and-mcp-architecture',
    category: 'nestjs',
    viewsCount: 151,
    helpfulCount: 49,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'adr-full-stack-catalog',
    category: 'typescript',
    viewsCount: 142,
    helpfulCount: 38,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'testing--backend--smoke-tests-and-backend-testing-taxonomy',
    category: 'testing',
    viewsCount: 134,
    helpfulCount: 42,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
  {
    slug: 'indexeddb-bundle-diet-docker',
    category: 'architecture-devops',
    viewsCount: 129,
    helpfulCount: 44,
    updatedAt: '2026-11-23T09:00:00.000Z',
  },
]

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

function renderLeaderboard() {
  const client = makeQueryClient()
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QueryClientProvider client={client}>
        <KnowledgeLeaderboardCard locale="en" />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

describe('KnowledgeLeaderboardCard (Integration: RTL + TanStack Query + apiClient + MSW)', () => {
  it('loads Page 1, paginates to Page 2, and filters by category via real HTTP query params', async () => {
    const requestedUrls: string[] = []

    server.use(
      http.get('http://localhost:3000/api/knowledge/metrics/paginated', ({ request }) => {
        requestedUrls.push(request.url)
        const url = new URL(request.url)
        const limit = Number(url.searchParams.get('limit') ?? '5')
        const offset = Number(url.searchParams.get('offset') ?? '0')
        const category = url.searchParams.get('category')
        const sortBy = url.searchParams.get('sortBy') ?? 'viewsCount'

        const filtered = category ? ALL_METRICS.filter((item) => item.category === category) : [...ALL_METRICS]
        filtered.sort((a, b) =>
          sortBy === 'helpfulCount' ? b.helpfulCount - a.helpfulCount : b.viewsCount - a.viewsCount,
        )
        const items = filtered.slice(offset, offset + limit)
        const consumed = offset + items.length
        const hasMore = consumed < filtered.length

        return HttpResponse.json({
          items,
          total: filtered.length,
          limit,
          offset,
          hasMore,
          nextOffset: hasMore ? consumed : null,
        })
      }),
    )

    renderLeaderboard()

    // Page 1 renders top 5 seeded items
    expect(
      await screen.findByText('this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki'),
    ).toBeInTheDocument()
    expect(screen.queryByText('strict-typescript-zod-contracts')).not.toBeInTheDocument()
    expect(requestedUrls[0]).toBe(
      'http://localhost:3000/api/knowledge/metrics/paginated?limit=5&offset=0&sortBy=viewsCount',
    )

    // Click Page 2 button
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText('strict-typescript-zod-contracts')).toBeInTheDocument()
    expect(requestedUrls[1]).toBe(
      'http://localhost:3000/api/knowledge/metrics/paginated?limit=5&offset=5&sortBy=viewsCount',
    )

    // Filter by TypeScript category -> resets offset=0 and adds category=typescript
    fireEvent.click(screen.getByRole('radio', { name: 'TypeScript' }))
    await waitFor(() => {
      expect(screen.getByText('adr-full-stack-catalog')).toBeInTheDocument()
    })
    expect(screen.queryByText('react-18-vs-19-compiler-d3')).not.toBeInTheDocument()
    expect(requestedUrls.at(-1)).toBe(
      'http://localhost:3000/api/knowledge/metrics/paginated?limit=5&offset=0&sortBy=viewsCount&category=typescript',
    )

    // Switch sorting to helpfulCount -> keeps category=typescript and sets sortBy=helpfulCount
    fireEvent.click(screen.getByRole('radio', { name: enMessages.SystemStatusPage.sortHelpful }))
    await waitFor(() => {
      expect(requestedUrls.at(-1)).toBe(
        'http://localhost:3000/api/knowledge/metrics/paginated?limit=5&offset=0&sortBy=helpfulCount&category=typescript',
      )
    })
  })
})
