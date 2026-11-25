import { KnowledgeSearchPayloadSchema } from '@repo/shared-schemas'
import { describe, expect, it } from 'vitest'
import type { KnowledgeSearchItem } from '@/entities/knowledge-content'
import {
  createKnowledgeSearchEngine,
  filterCommandPaletteEntries,
  type QuickActionPaletteEntry,
} from '../lib/filter-command-entries'

const SAMPLE_ACTIONS: readonly QuickActionPaletteEntry[] = [
  { kind: 'quick-action', section: 'quick-actions', id: 'qa-cv', label: 'Workfolio CV', actionType: 'cv-home' },
  {
    kind: 'quick-action',
    section: 'quick-actions',
    id: 'qa-status',
    label: 'System Observability',
    actionType: 'system-status',
  },
]

const SAMPLE_ITEMS: readonly KnowledgeSearchItem[] = [
  {
    routePath: 'this-project/frontend-architecture/fsd-modular',
    category: 'this-project',
    topicLabel: 'This Project',
    subtopicLabel: 'Frontend Architecture',
    sidebarLabel: 'FSD-Modular',
    title: 'Feature-Sliced Design for Next.js 16',
    summary: 'How strict downward layer imports keep Next.js App Router maintainable.',
    format: 'adr',
    readingTime: '6 min read',
    tags: ['architecture', 'nextjs', 'fsd'],
    headings: [{ id: 'layer-boundaries', text: 'Layer Boundaries & Rules' }],
  },
  {
    routePath: 'react/compiler/memoization',
    category: 'react',
    topicLabel: 'React',
    subtopicLabel: 'React Compiler',
    sidebarLabel: 'Auto Memoization',
    title: 'React 19 Compiler & Automatic Memoization',
    summary: 'Understanding how babel-plugin-react-compiler optimizes renders.',
    format: 'deep-dive',
    readingTime: '8 min read',
    tags: ['react', 'compiler', 'performance'],
    headings: [{ id: 'bailout-rules', text: 'Compiler Bailout Rules' }],
  },
  {
    routePath: 'nestjs/security/jwt-cookies',
    category: 'nestjs',
    topicLabel: 'NestJS',
    subtopicLabel: 'Security',
    sidebarLabel: 'HttpOnly Cookies',
    title: 'Zero-LocalStorage JWT & Телеметрия',
    summary: 'Secure HttpOnly SameSite cookies and live SSE telemetry stream.',
    format: 'cheat-sheet',
    readingTime: '4 min read',
    tags: ['security', 'jwt', 'telemetry'],
    headings: [{ id: 'edge-crypto', text: 'Web Crypto HS256 Verification' }],
  },
]

describe('filterCommandPaletteEntries (MiniSearch)', () => {
  const engine = createKnowledgeSearchEngine(SAMPLE_ITEMS)

  it('splits empty-query articles into public-articles and protected-articles for guests', () => {
    const entries = filterCommandPaletteEntries({
      engine,
      quickActions: SAMPLE_ACTIONS,
      query: '',
      isUnlocked: false,
    })

    const sections = entries.map((entry) => entry.section)
    expect(sections).toEqual([
      'quick-actions',
      'quick-actions',
      'public-articles',
      'protected-articles',
      'protected-articles',
    ])
  })

  it('keeps a single articles section for unlocked users on empty query', () => {
    const entries = filterCommandPaletteEntries({
      engine,
      quickActions: SAMPLE_ACTIONS,
      query: '',
      isUnlocked: true,
    })

    const articleSections = entries.filter((entry) => entry.kind === 'article').map((entry) => entry.section)
    expect(articleSections).toEqual(['articles', 'articles', 'articles'])
  })

  it('supports typo-tolerant fuzzy search and prefix matching', () => {
    const typoResults = filterCommandPaletteEntries({
      engine,
      quickActions: SAMPLE_ACTIONS,
      query: 'compler',
      isUnlocked: true,
    })
    expect(typoResults.some((entry) => entry.id === 'react/compiler/memoization')).toBe(true)

    const cyrillicPrefix = filterCommandPaletteEntries({
      engine,
      quickActions: SAMPLE_ACTIONS,
      query: 'телемет',
      isUnlocked: true,
    })
    expect(cyrillicPrefix.some((entry) => entry.id === 'nestjs/security/jwt-cookies')).toBe(true)
  })

  it('matches h2/h3 headings and attaches matchedHeading for deep-link jumping', () => {
    const results = filterCommandPaletteEntries({
      engine,
      quickActions: SAMPLE_ACTIONS,
      query: 'Bailout',
      isUnlocked: true,
    })

    const articleEntry = results.find((entry) => entry.kind === 'article')
    expect(articleEntry?.kind).toBe('article')
    if (articleEntry?.kind === 'article') {
      expect(articleEntry.matchedHeading).toEqual({
        id: 'bailout-rules',
        text: 'Compiler Bailout Rules',
      })
    }
  })

  it('filters strictly by #tag when query starts with #', () => {
    const results = filterCommandPaletteEntries({
      engine,
      quickActions: SAMPLE_ACTIONS,
      query: '#jwt',
      isUnlocked: true,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('nestjs/security/jwt-cookies')
  })

  it('matches the shared KnowledgeSearchPayloadSchema contract end-to-end', () => {
    const parsed = KnowledgeSearchPayloadSchema.safeParse({
      items: SAMPLE_ITEMS,
      topTags: [{ tag: 'jwt', count: 1 }],
    })
    expect(parsed.success).toBe(true)
  })
})
