import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_LOCALE,
  formatKnowledgeSegmentLabel,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
  type SupportedLocale,
  SupportedLocaleEnum,
} from '@repo/shared-schemas'
import { cache } from 'react'
import { parseFrontmatterOnly, parseRawMdx } from './mdx-ast-parser'
import type {
  KnowledgeBreadcrumbItem,
  KnowledgeTreeFolderNode,
  KnowledgeTreeNode,
  MdxArticleDocument,
  MdxArticleFrontmatter,
} from './mdx-types'

interface CachedFrontmatterEntry {
  mtimeMs: number
  frontmatter: MdxArticleFrontmatter
  targetPath: string
  category: KnowledgeCategory
  leafSlug: string
  relativeSubSegments: readonly string[]
  resolvedLocale: SupportedLocale
  isFallback: boolean
}

interface CachedDocumentEntry {
  mtimeMs: number
  doc: MdxArticleDocument
}

const globalForKbCache = globalThis as unknown as {
  __kbFrontmatterCache?: Map<string, CachedFrontmatterEntry>
  __kbDocumentCache?: Map<string, CachedDocumentEntry>
}

const frontmatterCache: Map<string, CachedFrontmatterEntry> =
  globalForKbCache.__kbFrontmatterCache ?? new Map<string, CachedFrontmatterEntry>()
globalForKbCache.__kbFrontmatterCache = frontmatterCache

const documentCache: Map<string, CachedDocumentEntry> =
  globalForKbCache.__kbDocumentCache ?? new Map<string, CachedDocumentEntry>()
globalForKbCache.__kbDocumentCache = documentCache

function resolveContentRoot(): string {
  const candidates = [join(process.cwd(), 'content'), join(process.cwd(), 'apps', 'web', 'content')]
  for (const dir of candidates) {
    if (existsSync(dir)) {
      return dir
    }
  }
  return join(process.cwd(), 'content')
}

function extractBaseSlug(filename: string): string {
  return filename.replace(/\.(en|uk|ru)\.mdx$/, '').replace(/\.mdx$/, '')
}

export function normalizeLocale(localeInput?: string): SupportedLocale {
  const parsed = SupportedLocaleEnum.safeParse(localeInput)
  return parsed.success ? parsed.data : DEFAULT_LOCALE
}

export function toFrontmatter(doc: MdxArticleDocument): MdxArticleFrontmatter {
  return {
    slug: doc.slug,
    leafSlug: doc.leafSlug,
    category: doc.category,
    pathSegments: doc.pathSegments,
    routePath: doc.routePath,
    locale: doc.locale,
    isFallback: doc.isFallback,
    title: doc.title,
    sidebarLabel: doc.sidebarLabel,
    summary: doc.summary,
    readingTime: doc.readingTime,
    publishedAt: doc.publishedAt,
    order: doc.order,
    format: doc.format,
    tags: doc.tags,
    tldr: doc.tldr,
  }
}

function loadCachedFrontmatterEntry(
  targetPath: string,
  category: KnowledgeCategory,
  leafSlug: string,
  relativeSubSegments: readonly string[],
  resolvedLocale: SupportedLocale,
  isFallback: boolean,
): CachedFrontmatterEntry {
  const mtimeMs = statSync(targetPath).mtimeMs
  const cacheKey = `${targetPath}:${resolvedLocale}:${isFallback ? 'fb' : 'ex'}`
  const cached = frontmatterCache.get(cacheKey)

  if (cached && cached.mtimeMs === mtimeMs) {
    return cached
  }

  const raw = readFileSync(targetPath, 'utf-8')
  const { frontmatter } = parseFrontmatterOnly(raw, category, leafSlug, relativeSubSegments, resolvedLocale, isFallback)
  const entry: CachedFrontmatterEntry = {
    mtimeMs,
    frontmatter,
    targetPath,
    category,
    leafSlug,
    relativeSubSegments,
    resolvedLocale,
    isFallback,
  }
  frontmatterCache.set(cacheKey, entry)
  return entry
}

function loadCachedDocumentFromEntry(entry: CachedFrontmatterEntry): MdxArticleDocument {
  const mtimeMs = statSync(entry.targetPath).mtimeMs
  const cacheKey = `${entry.targetPath}:${entry.resolvedLocale}:${entry.isFallback ? 'fb' : 'ex'}`
  const cached = documentCache.get(cacheKey)

  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.doc
  }

  const raw = readFileSync(entry.targetPath, 'utf-8')
  const doc = parseRawMdx(
    raw,
    entry.category,
    entry.leafSlug,
    entry.relativeSubSegments,
    entry.resolvedLocale,
    entry.isFallback,
  )
  documentCache.set(cacheKey, { mtimeMs, doc })
  return doc
}

function scanCategoryEntriesRecursively(
  dirPath: string,
  category: KnowledgeCategory,
  relativeSubSegments: readonly string[],
  requestedLocale: SupportedLocale,
  outEntries: CachedFrontmatterEntry[],
): void {
  if (!existsSync(dirPath)) return

  const entries = readdirSync(dirPath, { withFileTypes: true })
  const mdxFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.mdx')).map((e) => e.name)
  const uniqueLeafSlugs = Array.from(new Set(mdxFiles.map(extractBaseSlug))).sort()

  for (const leafSlug of uniqueLeafSlugs) {
    const exactCandidate = join(dirPath, `${leafSlug}.${requestedLocale}.mdx`)
    const defaultLocaleCandidate = join(dirPath, `${leafSlug}.${DEFAULT_LOCALE}.mdx`)
    const legacyCandidate = join(dirPath, `${leafSlug}.mdx`)

    let targetPath = ''
    let resolvedLocale: SupportedLocale = requestedLocale
    let isFallback = false

    if (existsSync(exactCandidate)) {
      targetPath = exactCandidate
      resolvedLocale = requestedLocale
      isFallback = false
    } else if (existsSync(defaultLocaleCandidate)) {
      targetPath = defaultLocaleCandidate
      resolvedLocale = DEFAULT_LOCALE
      isFallback = requestedLocale !== DEFAULT_LOCALE
    } else if (existsSync(legacyCandidate)) {
      targetPath = legacyCandidate
      resolvedLocale = DEFAULT_LOCALE
      isFallback = requestedLocale !== DEFAULT_LOCALE
    }

    if (targetPath) {
      outEntries.push(
        loadCachedFrontmatterEntry(targetPath, category, leafSlug, relativeSubSegments, resolvedLocale, isFallback),
      )
    }
  }

  const subDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort()

  for (const subDir of subDirs) {
    scanCategoryEntriesRecursively(
      join(dirPath, subDir),
      category,
      [...relativeSubSegments, subDir],
      requestedLocale,
      outEntries,
    )
  }
}

const getAllCachedFrontmatterEntriesByLocale = cache((requestedLocale: SupportedLocale): CachedFrontmatterEntry[] => {
  const root = resolveContentRoot()
  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]
  const entries: CachedFrontmatterEntry[] = []

  for (const category of categories) {
    const categoryDir = join(root, category)
    scanCategoryEntriesRecursively(categoryDir, category, [], requestedLocale, entries)
  }

  return entries.sort(
    (a, b) =>
      a.frontmatter.order - b.frontmatter.order || a.frontmatter.routePath.localeCompare(b.frontmatter.routePath),
  )
})

const getAllKnowledgeFrontmattersByLocale = cache((locale: SupportedLocale): MdxArticleFrontmatter[] => {
  return getAllCachedFrontmatterEntriesByLocale(locale).map((entry) => entry.frontmatter)
})

/**
 * Lightweight frontmatter-only list (0 Markdown/HAST body parsing).
 * Used by KnowledgeSidebar, KnowledgeDirectoryExplorer, and tag counters for sub-millisecond response in dev & prod.
 */
export function getAllKnowledgeFrontmatters(localeInput?: string): MdxArticleFrontmatter[] {
  return getAllKnowledgeFrontmattersByLocale(normalizeLocale(localeInput))
}

const getAllKnowledgeArticlesByLocale = cache((locale: SupportedLocale): MdxArticleDocument[] => {
  return getAllCachedFrontmatterEntriesByLocale(locale).map((entry) => loadCachedDocumentFromEntry(entry))
})

export function getAllKnowledgeArticles(localeInput?: string): MdxArticleDocument[] {
  return getAllKnowledgeArticlesByLocale(normalizeLocale(localeInput))
}

function insertArticleIntoFolder(
  folder: KnowledgeTreeFolderNode,
  remainingSegments: readonly string[],
  article: MdxArticleFrontmatter,
  locale: SupportedLocale,
): void {
  folder.articleCount += 1
  folder.minOrder = Math.min(folder.minOrder, article.order)

  if (remainingSegments.length <= 1) {
    folder.children.push({
      type: 'article',
      pathKey: article.routePath,
      article,
    })
    return
  }

  const nextSegment = remainingSegments[0]
  if (!nextSegment) return

  const nextPathSegments = [...folder.pathSegments, nextSegment]
  const nextPathKey = nextPathSegments.join('/')

  let childFolder = folder.children.find(
    (child): child is KnowledgeTreeFolderNode => child.type === 'folder' && child.pathKey === nextPathKey,
  )

  if (!childFolder) {
    childFolder = {
      type: 'folder',
      pathKey: nextPathKey,
      segment: nextSegment,
      label: formatKnowledgeSegmentLabel(nextSegment, locale),
      pathSegments: nextPathSegments,
      articleCount: 0,
      minOrder: article.order,
      children: [],
    }
    folder.children.push(childFolder)
  }

  insertArticleIntoFolder(childFolder, remainingSegments.slice(1), article, locale)
}

function sortTreeNodesRecursively(nodes: KnowledgeTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    if (a.type === 'folder' && b.type === 'folder') {
      return a.minOrder - b.minOrder || a.label.localeCompare(b.label)
    }
    if (a.type === 'article' && b.type === 'article') {
      return a.article.order - b.article.order || a.article.sidebarLabel.localeCompare(b.article.sidebarLabel)
    }
    return 0
  })

  for (const node of nodes) {
    if (node.type === 'folder') {
      sortTreeNodesRecursively(node.children)
    }
  }
}

const getKnowledgeTreeByLocale = cache((locale: SupportedLocale): KnowledgeTreeFolderNode[] => {
  const frontmatters = getAllKnowledgeFrontmattersByLocale(locale)
  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]
  const rootFolders: KnowledgeTreeFolderNode[] = []

  for (const category of categories) {
    const categoryArticles = frontmatters.filter((a) => a.category === category)
    if (categoryArticles.length === 0) continue

    const rootFolder: KnowledgeTreeFolderNode = {
      type: 'folder',
      pathKey: category,
      segment: category,
      label: formatKnowledgeSegmentLabel(category, locale),
      pathSegments: [category],
      articleCount: 0,
      minOrder: 999,
      children: [],
    }

    for (const frontmatter of categoryArticles) {
      insertArticleIntoFolder(rootFolder, frontmatter.pathSegments.slice(1), frontmatter, locale)
    }

    sortTreeNodesRecursively(rootFolder.children)
    rootFolders.push(rootFolder)
  }

  return rootFolders
})

export function getKnowledgeTree(localeInput?: string): KnowledgeTreeFolderNode[] {
  return getKnowledgeTreeByLocale(normalizeLocale(localeInput))
}

/**
 * Primitive-keyed `React.cache` loader so `generateMetadata()` and `Page()`
 * share the exact same memoized entry even when Next.js passes distinct `slug[]` array instances.
 */
const getArticleByRouteKey = cache((targetRoute: string, locale: SupportedLocale): MdxArticleDocument | null => {
  const entries = getAllCachedFrontmatterEntriesByLocale(locale)
  const matchedEntry = entries.find((e) => e.frontmatter.routePath === targetRoute)
  if (!matchedEntry) {
    return null
  }
  return loadCachedDocumentFromEntry(matchedEntry)
})

/**
 * On-demand single-article HAST loader: parses full Markdown/HAST only for the requested routePath!
 */
export function getArticleByPathSegments(segments: readonly string[], localeInput?: string): MdxArticleDocument | null {
  return getArticleByRouteKey(segments.join('/'), normalizeLocale(localeInput))
}

const getFolderByRouteKey = cache((routeKey: string, locale: SupportedLocale): KnowledgeTreeFolderNode | null => {
  if (!routeKey) return null
  const segments = routeKey.split('/')
  const tree = getKnowledgeTreeByLocale(locale)
  const rootSegment = segments[0]
  let current: KnowledgeTreeFolderNode | undefined = tree.find((node) => node.segment === rootSegment)

  for (let i = 1; i < segments.length; i += 1) {
    if (!current) return null
    const seg = segments[i]
    current = current.children.find(
      (child): child is KnowledgeTreeFolderNode => child.type === 'folder' && child.segment === seg,
    )
  }

  return current ?? null
})

export function getFolderByPathSegments(
  segments: readonly string[],
  localeInput?: string,
): KnowledgeTreeFolderNode | null {
  if (segments.length === 0) return null
  return getFolderByRouteKey(segments.join('/'), normalizeLocale(localeInput))
}

export function buildKnowledgeBreadcrumbs(
  segments: readonly string[],
  localeInput?: string,
  leafOverrideTitle?: string,
): KnowledgeBreadcrumbItem[] {
  const locale = normalizeLocale(localeInput)
  const crumbs: KnowledgeBreadcrumbItem[] = []

  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i]
    if (!seg) continue
    const isLast = i === segments.length - 1
    const href = `/knowledge-base/${segments.slice(0, i + 1).join('/')}`
    const label = isLast && leafOverrideTitle ? leafOverrideTitle : formatKnowledgeSegmentLabel(seg, locale)
    crumbs.push({ label, href })
  }

  return crumbs
}

export function getAllStaticKnowledgeSlugArrays(): string[][] {
  const tree = getKnowledgeTree(DEFAULT_LOCALE)
  const paths: string[][] = []

  const walk = (node: KnowledgeTreeNode) => {
    if (node.type === 'folder') {
      paths.push(node.pathSegments)
      for (const child of node.children) {
        walk(child)
      }
    } else {
      paths.push(node.article.pathSegments)
    }
  }

  for (const root of tree) {
    walk(root)
  }

  return paths
}

export function getAdjacentAndRelatedArticles(
  currentRoutePath: string,
  localeInput?: string,
): {
  prev: MdxArticleFrontmatter | null
  next: MdxArticleFrontmatter | null
  related: MdxArticleFrontmatter[]
} {
  const locale = normalizeLocale(localeInput)
  const tree = getKnowledgeTree(locale)
  const orderedFrontmatters: MdxArticleFrontmatter[] = []

  const flattenArticles = (nodes: readonly KnowledgeTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'article') {
        orderedFrontmatters.push(node.article)
      } else {
        flattenArticles(node.children)
      }
    }
  }

  flattenArticles(tree)

  const currentIdx = orderedFrontmatters.findIndex((a) => a.routePath === currentRoutePath)
  const current = currentIdx !== -1 ? orderedFrontmatters[currentIdx] : undefined
  const prev = currentIdx > 0 ? (orderedFrontmatters[currentIdx - 1] ?? null) : null
  const next =
    currentIdx !== -1 && currentIdx < orderedFrontmatters.length - 1
      ? (orderedFrontmatters[currentIdx + 1] ?? null)
      : null

  if (!current) {
    return { prev, next, related: [] }
  }

  const currentTagSet = new Set(current.tags)
  const related = orderedFrontmatters
    .filter((candidate) => candidate.routePath !== current.routePath)
    .map((candidate) => {
      let sharedTags = 0
      for (const tag of candidate.tags) {
        if (currentTagSet.has(tag)) sharedTags += 1
      }
      const sameCategoryBonus = candidate.category === current.category ? 0.5 : 0
      return {
        candidate,
        score: sharedTags + sameCategoryBonus,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.order - b.candidate.order)
    .slice(0, 3)
    .map((entry) => entry.candidate)

  return { prev, next, related }
}
