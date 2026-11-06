import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_LOCALE,
  formatKnowledgeSegmentLabel,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type SupportedLocale,
  SupportedLocaleEnum,
} from '@repo/shared-schemas'
import { cache } from 'react'

export interface ArticleTocEntry {
  id: string
  text: string
  level: 2 | 3 | 4
}

export interface MdxArticleFrontmatter {
  /** Safe metric key without slashes for API/DB views & helpful reactions */
  slug: string
  /** Leaf filename without locale suffix or .mdx extension */
  leafSlug: string
  /** Root category (first segment) */
  category: KnowledgeCategory
  /** Full path segments under /knowledge-base */
  pathSegments: string[]
  /** Joined URL route path */
  routePath: string
  locale: SupportedLocale
  isFallback: boolean
  title: string
  /** Concise single-line label displayed inside the left sidebar tree */
  sidebarLabel: string
  summary: string
  readingTime: string
  publishedAt: string
  order: number
  tldr: string[]
}

export interface MdxListItem {
  text: string
  checked?: boolean | undefined
  subItems: string[]
}

export type MdxCalloutKind = 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'quote'

export type MdxBlock =
  | { type: 'heading'; level: 2 | 3 | 4; id: string; text: string; plainText: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: MdxListItem[] }
  | { type: 'code'; language: string; title?: string | undefined; code: string }
  | {
      type: 'table'
      headers: string[]
      alignments: Array<'left' | 'center' | 'right'>
      rows: string[][]
    }
  | { type: 'callout'; kind: MdxCalloutKind; title?: string | undefined; lines: string[] }
  | { type: 'hr' }
  | { type: 'component'; name: 'ReactRenderGraphD3' | 'ArchitectureFlowD3' | 'ArticleImageGrid' }

export interface MdxArticleDocument extends MdxArticleFrontmatter {
  toc: ArticleTocEntry[]
  blocks: MdxBlock[]
}

export interface KnowledgeTreeFolderNode {
  type: 'folder'
  pathKey: string
  segment: string
  label: string
  pathSegments: string[]
  articleCount: number
  minOrder: number
  children: KnowledgeTreeNode[]
}

export interface KnowledgeTreeArticleNode {
  type: 'article'
  pathKey: string
  article: MdxArticleFrontmatter
}

export type KnowledgeTreeNode = KnowledgeTreeFolderNode | KnowledgeTreeArticleNode

export interface KnowledgeBreadcrumbItem {
  label: string
  href: string
}

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

function stripInlineMarkdown(raw: string): string {
  return raw
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function createHeadingSlug(plainText: string, usedIds: Map<string, number>): string {
  const base =
    plainText
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-') || 'section'

  const seenCount = usedIds.get(base) ?? 0
  usedIds.set(base, seenCount + 1)
  return seenCount === 0 ? base : `${base}-${seenCount + 1}`
}

function parseTableCells(rowLine: string): string[] {
  const trimmed = rowLine.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('|') || !trimmed.includes('-')) return false
  const cells = parseTableCells(trimmed)
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c))
}

function parseCodeFenceHeader(fenceRest: string): { language: string; title?: string | undefined } {
  const trimmed = fenceRest.trim()
  if (!trimmed) {
    return { language: 'typescript' }
  }

  const titleAttrMatch = trimmed.match(/^(\S+)\s+title=["']([^"']+)["']/)
  if (titleAttrMatch) {
    return {
      language: titleAttrMatch[1] ?? 'typescript',
      title: titleAttrMatch[2],
    }
  }

  const parts = trimmed.split(/\s+/)
  const language = parts[0] ?? 'typescript'
  const restTitle = parts.slice(1).join(' ').trim()
  return {
    language,
    title: restTitle ? restTitle.replace(/^["']|["']$/g, '') : undefined,
  }
}

function parseFrontmatterBlock(rawBody: string): {
  meta: Record<string, string>
  tldr: string[]
  markdownBody: string
} {
  const meta: Record<string, string> = {}
  const tldr: string[] = []
  let markdownBody = rawBody.trim()

  if (!markdownBody.startsWith('---')) {
    return { meta, tldr, markdownBody }
  }

  const endIdx = markdownBody.indexOf('---', 3)
  if (endIdx === -1) {
    return { meta, tldr, markdownBody }
  }

  const frontmatterLines = markdownBody.slice(3, endIdx).trim().split(/\r?\n/)
  let idx = 0

  while (idx < frontmatterLines.length) {
    const rawLine = frontmatterLines[idx] ?? ''
    const trimmedLine = rawLine.trim()
    if (!trimmedLine) {
      idx += 1
      continue
    }

    const colonIdx = trimmedLine.indexOf(':')
    if (colonIdx !== -1) {
      const key = trimmedLine.slice(0, colonIdx).trim()
      const rawVal = trimmedLine.slice(colonIdx + 1).trim()

      if (key === 'tldr' && !rawVal) {
        idx += 1
        while (idx < frontmatterLines.length) {
          const itemLine = (frontmatterLines[idx] ?? '').trim()
          if (!itemLine.startsWith('- ')) break
          const cleanedItem = itemLine
            .slice(2)
            .trim()
            .replace(/^["']|["']$/g, '')
          if (cleanedItem) tldr.push(cleanedItem)
          idx += 1
        }
        continue
      }

      meta[key] = rawVal.replace(/^["']|["']$/g, '')
    }

    idx += 1
  }

  markdownBody = markdownBody.slice(endIdx + 3).trim()
  return { meta, tldr, markdownBody }
}

function isSpecialBlockStart(rawLine: string, nextLine?: string): boolean {
  const trimmed = rawLine.trim()
  if (!trimmed) return true
  if (
    trimmed === '<ReactRenderGraphD3 />' ||
    trimmed === '<ArchitectureFlowD3 />' ||
    trimmed === '<ArticleImageGrid />'
  ) {
    return true
  }
  if (/^#{2,4}\s+/.test(trimmed)) return true
  if (trimmed.startsWith('```')) return true
  if (/^(-{3,}|\*{3,})$/.test(trimmed)) return true
  if (trimmed.startsWith('>')) return true
  if (/^([-*]|\d+\.)\s+/.test(trimmed)) return true
  if (trimmed.includes('|') && nextLine !== undefined && isTableSeparatorLine(nextLine)) return true
  return false
}

function parseRawMdx(
  raw: string,
  fallbackCategory: KnowledgeCategory,
  leafSlug: string,
  relativeSubSegments: readonly string[],
  locale: SupportedLocale,
  isFallback: boolean,
): MdxArticleDocument {
  const { meta, tldr, markdownBody } = parseFrontmatterBlock(raw)

  const parsedCategory = KnowledgeCategoryEnum.safeParse(meta.category)
  const category = parsedCategory.success ? parsedCategory.data : fallbackCategory
  const pathSegments = [category, ...relativeSubSegments, leafSlug]
  const routePath = pathSegments.join('/')
  const metricSlug = meta.metricSlug || (relativeSubSegments.length === 0 ? leafSlug : pathSegments.join('--'))
  const parsedOrder = meta.order ? Number.parseInt(meta.order, 10) : Number.NaN

  const lines = markdownBody.split(/\r?\n/)
  const blocks: MdxBlock[] = []
  const toc: ArticleTocEntry[] = []
  const usedHeadingIds = new Map<string, number>()
  let i = 0

  while (i < lines.length) {
    const rawLine = lines[i] ?? ''
    const line = rawLine.trim()

    if (!line) {
      i += 1
      continue
    }

    if (line === '<ReactRenderGraphD3 />') {
      blocks.push({ type: 'component', name: 'ReactRenderGraphD3' })
      i += 1
      continue
    }

    if (line === '<ArchitectureFlowD3 />') {
      blocks.push({ type: 'component', name: 'ArchitectureFlowD3' })
      i += 1
      continue
    }

    if (line === '<ArticleImageGrid />') {
      blocks.push({ type: 'component', name: 'ArticleImageGrid' })
      i += 1
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/)
    if (headingMatch) {
      const hashes = headingMatch[1] ?? '##'
      const rawHeadingText = (headingMatch[2] ?? '').trim()
      const level = (hashes.length === 3 ? 3 : hashes.length === 4 ? 4 : 2) as 2 | 3 | 4
      const plainText = stripInlineMarkdown(rawHeadingText)
      const id = createHeadingSlug(plainText, usedHeadingIds)

      blocks.push({
        type: 'heading',
        level,
        id,
        text: rawHeadingText,
        plainText,
      })
      toc.push({
        id,
        text: plainText,
        level,
      })
      i += 1
      continue
    }

    if (line.startsWith('```')) {
      const { language, title } = parseCodeFenceHeader(line.slice(3))
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[i] ?? '')
        i += 1
      }
      i += 1
      blocks.push({
        type: 'code',
        language,
        title,
        code: codeLines.join('\n'),
      })
      continue
    }

    // GFM Markdown Table
    if (line.includes('|') && i + 1 < lines.length && isTableSeparatorLine(lines[i + 1] ?? '')) {
      const headers = parseTableCells(line)
      const separatorCells = parseTableCells(lines[i + 1] ?? '')
      const alignments: Array<'left' | 'center' | 'right'> = separatorCells.map((sep) => {
        if (sep.startsWith(':') && sep.endsWith(':')) return 'center'
        if (sep.endsWith(':')) return 'right'
        return 'left'
      })
      i += 2
      const rows: string[][] = []
      while (i < lines.length) {
        const candidate = (lines[i] ?? '').trim()
        if (!candidate.includes('|')) break
        rows.push(parseTableCells(candidate))
        i += 1
      }
      blocks.push({
        type: 'table',
        headers,
        alignments,
        rows,
      })
      continue
    }

    // GitHub Alert Callout or Blockquote (> [!TIP] / > text)
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('>')) {
        quoteLines.push((lines[i] ?? '').trim().replace(/^>\s?/, '').trim())
        i += 1
      }

      const firstQuote = quoteLines[0] ?? ''
      const alertMatch = firstQuote.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i)
      if (alertMatch) {
        const rawKind = (alertMatch[1] ?? 'note').toLowerCase() as MdxCalloutKind
        const customTitle = (alertMatch[2] ?? '').trim() || undefined
        const bodyLines = quoteLines.slice(1).filter(Boolean)
        blocks.push({
          type: 'callout',
          kind: rawKind,
          title: customTitle,
          lines: bodyLines,
        })
      } else {
        blocks.push({
          type: 'callout',
          kind: 'quote',
          lines: quoteLines.filter(Boolean),
        })
      }
      continue
    }

    // Ordered or Unordered Lists (with nested 2+ space indented sub-items & task checkboxes)
    if (/^([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line)
      const items: MdxListItem[] = []

      while (i < lines.length) {
        const currentRaw = lines[i] ?? ''
        const currentTrimmed = currentRaw.trim()
        if (!currentTrimmed) break

        const isNestedSubItem = /^\s{2,}([-*]|\d+\.)\s+/.test(currentRaw)
        if (isNestedSubItem && items.length > 0) {
          const lastItem = items[items.length - 1]
          const subCleaned = currentTrimmed.replace(/^([-*]|\d+\.)\s+/, '')
          lastItem?.subItems.push(subCleaned)
          i += 1
          continue
        }

        if (!/^([-*]|\d+\.)\s+/.test(currentTrimmed)) break

        let itemText = currentTrimmed.replace(/^([-*]|\d+\.)\s+/, '')
        let checked: boolean | undefined
        if (itemText.startsWith('[x] ') || itemText.startsWith('[X] ')) {
          checked = true
          itemText = itemText.slice(4).trim()
        } else if (itemText.startsWith('[ ] ')) {
          checked = false
          itemText = itemText.slice(4).trim()
        }

        items.push({
          text: itemText,
          checked,
          subItems: [],
        })
        i += 1
      }

      blocks.push({
        type: 'list',
        ordered,
        items,
      })
      continue
    }

    // Multi-line Paragraph
    const paragraphLines: string[] = [line]
    i += 1
    while (i < lines.length && !isSpecialBlockStart(lines[i] ?? '', lines[i + 1])) {
      const nextTrimmed = (lines[i] ?? '').trim()
      if (!nextTrimmed) break
      paragraphLines.push(nextTrimmed)
      i += 1
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' '),
    })
  }

  const resolvedTitle = meta.title ?? leafSlug
  return {
    slug: metricSlug,
    leafSlug,
    category,
    pathSegments,
    routePath,
    locale,
    isFallback,
    title: resolvedTitle,
    sidebarLabel: meta.sidebarLabel || resolvedTitle,
    summary: meta.summary ?? '',
    readingTime: meta.readingTime ?? meta.readTime ?? '5 min',
    publishedAt: meta.publishedAt ?? '2026-10-15',
    order: Number.isFinite(parsedOrder) ? parsedOrder : 999,
    tldr,
    toc,
    blocks,
  }
}

function normalizeLocale(localeInput?: string): SupportedLocale {
  const parsed = SupportedLocaleEnum.safeParse(localeInput)
  return parsed.success ? parsed.data : DEFAULT_LOCALE
}

function toFrontmatter(doc: MdxArticleDocument): MdxArticleFrontmatter {
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
    tldr: doc.tldr,
  }
}

function scanCategoryDirectoryRecursively(
  dirPath: string,
  category: KnowledgeCategory,
  relativeSubSegments: readonly string[],
  requestedLocale: SupportedLocale,
  outArticles: MdxArticleDocument[],
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
      const raw = readFileSync(targetPath, 'utf-8')
      outArticles.push(parseRawMdx(raw, category, leafSlug, relativeSubSegments, resolvedLocale, isFallback))
    }
  }

  const subDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort()

  for (const subDir of subDirs) {
    scanCategoryDirectoryRecursively(
      join(dirPath, subDir),
      category,
      [...relativeSubSegments, subDir],
      requestedLocale,
      outArticles,
    )
  }
}

export const getAllKnowledgeArticles = cache((localeInput?: string): MdxArticleDocument[] => {
  const requestedLocale = normalizeLocale(localeInput)
  const root = resolveContentRoot()
  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]
  const articles: MdxArticleDocument[] = []

  for (const category of categories) {
    const categoryDir = join(root, category)
    scanCategoryDirectoryRecursively(categoryDir, category, [], requestedLocale, articles)
  }

  return articles.sort((a, b) => a.order - b.order || a.routePath.localeCompare(b.routePath))
})

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

export const getKnowledgeTree = cache((localeInput?: string): KnowledgeTreeFolderNode[] => {
  const locale = normalizeLocale(localeInput)
  const articles = getAllKnowledgeArticles(locale)
  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]
  const rootFolders: KnowledgeTreeFolderNode[] = []

  for (const category of categories) {
    const categoryArticles = articles.filter((a) => a.category === category)
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

    for (const doc of categoryArticles) {
      insertArticleIntoFolder(rootFolder, doc.pathSegments.slice(1), toFrontmatter(doc), locale)
    }

    sortTreeNodesRecursively(rootFolder.children)
    rootFolders.push(rootFolder)
  }

  return rootFolders
})

export const getArticleByPathSegments = cache(
  (segments: readonly string[], localeInput?: string): MdxArticleDocument | null => {
    const targetRoute = segments.join('/')
    const all = getAllKnowledgeArticles(localeInput)
    return all.find((a) => a.routePath === targetRoute) ?? null
  },
)

export const getFolderByPathSegments = cache(
  (segments: readonly string[], localeInput?: string): KnowledgeTreeFolderNode | null => {
    if (segments.length === 0) return null
    const tree = getKnowledgeTree(localeInput)
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
  },
)

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
