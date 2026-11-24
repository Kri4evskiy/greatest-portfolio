import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { INITIAL_ARTICLE_SEEDS } from '../../migrations/scripts/seed-data.js'
import { MAX_MEMORY_SESSIONS, PrismaService } from '../prisma.service.js'

describe('PrismaService (In-Memory fallback parity)', () => {
  it('seeds all INITIAL_ARTICLE_SEEDS and paginates with offset, category filter, and sortBy parity', async () => {
    const prisma = new PrismaService()

    const all = await prisma.getAllArticleMetrics()
    expect(all).toHaveLength(INITIAL_ARTICLE_SEEDS.length)

    // Page 1 (limit=5, offset=0, sortBy=viewsCount)
    const page1 = await prisma.getPaginatedArticleMetrics({
      limit: 5,
      offset: 0,
      sortBy: 'viewsCount',
    })
    expect(page1.items).toHaveLength(5)
    expect(page1.total).toBe(10)
    expect(page1.hasMore).toBe(true)
    expect(page1.nextOffset).toBe(5)
    expect(page1.items[0]?.slug).toBe('this-project--knowledge-engine--server-mdx-ast-dual-theme-shiki')

    // Page 2 (limit=5, offset=5)
    const page2 = await prisma.getPaginatedArticleMetrics({
      limit: 5,
      offset: 5,
      sortBy: 'viewsCount',
    })
    expect(page2.items).toHaveLength(5)
    expect(page2.hasMore).toBe(false)
    expect(page2.nextOffset).toBeNull()

    // Sorting by helpfulCount changes rank order (e.g. 49 helpful > 47 helpful despite 151 < 156 views)
    const byHelpful = await prisma.getPaginatedArticleMetrics({
      limit: 10,
      offset: 0,
      sortBy: 'helpfulCount',
    })
    const nestIdx = byHelpful.items.findIndex((i) => i.slug === 'nestjs--ai-mcp--nestjs-ai-and-mcp-architecture')
    const tsIdx = byHelpful.items.findIndex((i) => i.slug === 'strict-typescript-zod-contracts')
    expect(nestIdx).toBeGreaterThan(-1)
    expect(tsIdx).toBeGreaterThan(-1)
    expect(nestIdx).toBeLessThan(tsIdx)

    // Category filter parity
    const tsOnly = await prisma.getPaginatedArticleMetrics({
      limit: 5,
      offset: 0,
      category: 'typescript',
      sortBy: 'viewsCount',
    })
    expect(tsOnly.total).toBe(2)
    expect(tsOnly.hasMore).toBe(false)
    expect(tsOnly.items.every((item) => item.category === 'typescript')).toBe(true)

    // Empty category returns empty page
    const emptyCategory = await prisma.getPaginatedArticleMetrics({
      limit: 5,
      offset: 0,
      category: 'system-design',
      sortBy: 'viewsCount',
    })
    expect(emptyCategory).toEqual({
      items: [],
      total: 0,
      limit: 5,
      offset: 0,
      hasMore: false,
      nextOffset: null,
    })
  })

  it('filters system events by eventType, traverses cursors cleanly, and enforces MAX_MEMORY_SYSTEM_EVENTS = 200', async () => {
    const prisma = new PrismaService()

    for (let i = 1; i <= 205; i += 1) {
      await prisma.logSystemEvent(i % 2 === 0 ? 'ARTICLE_VIEWED' : 'GUEST_PASS_ISSUED', {
        id: randomUUID(),
        message: `Event #${i}`,
        slug: i % 2 === 0 ? `article-${i}` : undefined,
      })
    }

    // Total capped at 200 (newest 205..6 kept, oldest 5..1 dropped)
    const page1 = await prisma.getCursorPaginatedSystemEvents({ limit: 50 })
    const page2 = await prisma.getCursorPaginatedSystemEvents({ limit: 50, cursor: page1.nextCursor ?? undefined })
    const page3 = await prisma.getCursorPaginatedSystemEvents({ limit: 50, cursor: page2.nextCursor ?? undefined })
    const page4 = await prisma.getCursorPaginatedSystemEvents({ limit: 50, cursor: page3.nextCursor ?? undefined })

    expect(page1.items[0]?.message).toBe('Event #205')
    expect(page1.hasMore).toBe(true)
    expect(page4.items).toHaveLength(50)
    expect(page4.hasMore).toBe(false)
    expect(page4.nextCursor).toBeNull()
    expect(page4.items.at(-1)?.message).toBe('Event #6')

    // eventType filtering
    const viewedOnly = await prisma.getCursorPaginatedSystemEvents({
      limit: 10,
      eventType: 'ARTICLE_VIEWED',
    })
    expect(viewedOnly.items).toHaveLength(10)
    expect(viewedOnly.items.every((item) => item.type === 'ARTICLE_VIEWED')).toBe(true)

    // Unknown cursor returns empty page cleanly
    const unknownCursor = await prisma.getCursorPaginatedSystemEvents({
      limit: 10,
      cursor: randomUUID(),
    })
    expect(unknownCursor).toEqual({
      items: [],
      limit: 10,
      hasMore: false,
      nextCursor: null,
    })
  })

  it('increments views/helpful counters and creates visitor sessions in memory', async () => {
    const prisma = new PrismaService()

    const incremented = await prisma.incrementArticleView('adr-full-stack-catalog', 'typescript')
    expect(incremented.viewsCount).toBe(143)

    const helpful = await prisma.incrementArticleHelpful('adr-full-stack-catalog', 'typescript')
    expect(helpful.helpfulCount).toBe(39)

    const expiresAt = new Date(Date.now() + 60_000)
    const session = await prisma.createVisitorSession({
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      role: 'USER',
      userAgent: 'Vitest',
      expiresAt,
    })
    expect(session.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(session.role).toBe('USER')
  })

  it('bounds memorySessions at MAX_MEMORY_SESSIONS and prunes expired sessions', async () => {
    const prisma = new PrismaService()

    // Insert expired sessions first
    await prisma.createVisitorSession({
      displayName: 'Expired',
      visitorType: 'OTHER',
      role: 'USER',
      expiresAt: new Date(Date.now() - 1000),
    })

    const future = new Date(Date.now() + 60_000)
    for (let i = 0; i < MAX_MEMORY_SESSIONS + 25; i += 1) {
      await prisma.createVisitorSession({
        displayName: `User #${i}`,
        visitorType: 'DEVELOPER',
        role: 'USER',
        expiresAt: future,
      })
    }

    const stats = prisma.getMemoryStoreStats()
    expect(stats.sessions).toBe(MAX_MEMORY_SESSIONS)
  })
})
