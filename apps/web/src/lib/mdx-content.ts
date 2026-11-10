import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_LOCALE,
  formatKnowledgeSegmentLabel,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type KnowledgeNoteFormat,
  KnowledgeNoteFormatEnum,
  type SupportedLocale,
  SupportedLocaleEnum,
} from '@repo/shared-schemas'
import matter from 'gray-matter'
import type { Blockquote, Code, Content, Heading, List, Paragraph, PhrasingContent, Root, Table } from 'mdast'
import { cache } from 'react'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

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
  format: KnowledgeNoteFormat
  tags: string[]
  tldr: string[]
}

export type MdxCalloutKind = 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'quote'

export type MdxWidgetName = 'ReactRenderGraphD3' | 'ArchitectureFlowD3' | 'ArticleImageGrid' | 'NestAiMcpDiagram'

const SUPPORTED_MDX_WIDGETS = new Set<MdxWidgetName>([
  'ReactRenderGraphD3',
  'ArchitectureFlowD3',
  'ArticleImageGrid',
  'NestAiMcpDiagram',
])

export type MdxInlineNode =
  | { type: 'text'; value: string }
  | { type: 'inlineCode'; value: string }
  | { type: 'strong'; children: MdxInlineNode[] }
  | { type: 'emphasis'; children: MdxInlineNode[] }
  | { type: 'delete'; children: MdxInlineNode[] }
  | { type: 'link'; url: string; title?: string | undefined; children: MdxInlineNode[] }
  | { type: 'image'; url: string; alt: string; title?: string | undefined }
  | { type: 'break' }

export interface MdxListItemNode {
  checked?: boolean | undefined
  blocks: MdxBlock[]
}

export type MdxBlock =
  | { type: 'heading'; level: 2 | 3 | 4; id: string; inlines: MdxInlineNode[]; plainText: string }
  | { type: 'paragraph'; inlines: MdxInlineNode[] }
  | { type: 'image'; url: string; alt: string; caption?: string | undefined }
  | { type: 'list'; ordered: boolean; items: MdxListItemNode[] }
  | { type: 'code'; language: string; title?: string | undefined; code: string }
  | {
      type: 'table'
      headers: MdxInlineNode[][]
      alignments: Array<'left' | 'center' | 'right'>
      rows: MdxInlineNode[][][]
    }
  | { type: 'callout'; kind: MdxCalloutKind; title?: string | undefined; blocks: MdxBlock[] }
  | { type: 'hr' }
  | { type: 'component'; name: MdxWidgetName; props: Record<string, string> }

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

const markdownProcessor = unified().use(remarkParse).use(remarkGfm)

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

function normalizeTag(rawTag: string): string {
  return rawTag
    .trim()
    .replace(/^["'#]+|["']+$/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
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

function extractPlainTextFromInlines(nodes: readonly MdxInlineNode[]): string {
  let out = ''
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
      case 'inlineCode':
        out += node.value
        break
      case 'image':
        out += node.alt
        break
      case 'break':
        out += ' '
        break
      case 'strong':
      case 'emphasis':
      case 'delete':
      case 'link':
        out += extractPlainTextFromInlines(node.children)
        break
    }
  }
  return out.trim()
}

function convertPhrasingNodes(nodes: readonly PhrasingContent[]): MdxInlineNode[] {
  const result: MdxInlineNode[] = []

  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        if (node.value) {
          result.push({ type: 'text', value: node.value })
        }
        break
      case 'inlineCode':
        result.push({ type: 'inlineCode', value: node.value })
        break
      case 'strong':
        result.push({ type: 'strong', children: convertPhrasingNodes(node.children) })
        break
      case 'emphasis':
        result.push({ type: 'emphasis', children: convertPhrasingNodes(node.children) })
        break
      case 'delete':
        result.push({ type: 'delete', children: convertPhrasingNodes(node.children) })
        break
      case 'link':
        result.push({
          type: 'link',
          url: node.url,
          title: node.title ?? undefined,
          children: convertPhrasingNodes(node.children),
        })
        break
      case 'image':
        result.push({
          type: 'image',
          url: node.url,
          alt: node.alt ?? '',
          title: node.title ?? undefined,
        })
        break
      case 'break':
        result.push({ type: 'break' })
        break
      case 'html':
        if (node.value.trim() === '<br>' || node.value.trim() === '<br/>' || node.value.trim() === '<br />') {
          result.push({ type: 'break' })
        } else if (node.value) {
          result.push({ type: 'text', value: node.value })
        }
        break
      default:
        break
    }
  }

  return result
}

export function parseInlineMarkdownToAst(raw: string): MdxInlineNode[] {
  const trimmed = raw.trim()
  if (!trimmed) return []
  const tree = markdownProcessor.parse(trimmed) as Root
  const firstChild = tree.children[0]
  if (firstChild && firstChild.type === 'paragraph') {
    return convertPhrasingNodes(firstChild.children)
  }
  return [{ type: 'text', value: trimmed }]
}

function parseCustomWidgetTag(rawHtml: string): { name: MdxWidgetName; props: Record<string, string> } | null {
  const trimmed = rawHtml.trim()
  const tagMatch = trimmed.match(/^<([A-Z][A-Za-z0-9]*)\b([^>]*)\/>$/)
  if (!tagMatch) return null

  const candidateName = tagMatch[1] as MdxWidgetName
  if (!SUPPORTED_MDX_WIDGETS.has(candidateName)) {
    return null
  }

  const rawAttrs = tagMatch[2] ?? ''
  const props: Record<string, string> = {}
  const attrRegex = /([a-zA-Z][a-zA-Z0-9_-]*)=["']([^"']*)["']/g
  let match = attrRegex.exec(rawAttrs)
  while (match !== null) {
    const propKey = match[1]
    const propVal = match[2]
    if (propKey !== undefined && propVal !== undefined) {
      props[propKey] = propVal
    }
    match = attrRegex.exec(rawAttrs)
  }

  return { name: candidateName, props }
}

function parseCodeMetaTitle(meta?: string | null): string | undefined {
  if (!meta) return undefined
  const trimmed = meta.trim()
  if (!trimmed) return undefined

  const titleMatch = trimmed.match(/title=["']([^"']+)["']/)
  if (titleMatch?.[1]) {
    return titleMatch[1]
  }

  return trimmed.replace(/^["']|["']$/g, '') || undefined
}

function convertParagraphNode(node: Paragraph): MdxBlock | null {
  // Promote standalone Markdown image `![alt](url "caption")` into a dedicated figure block
  if (node.children.length === 1 && node.children[0]?.type === 'image') {
    const img = node.children[0]
    return {
      type: 'image',
      url: img.url,
      alt: img.alt ?? '',
      caption: img.title ?? (img.alt || undefined),
    }
  }

  const inlines = convertPhrasingNodes(node.children)
  if (inlines.length === 0) return null
  return { type: 'paragraph', inlines }
}

function convertHeadingNode(
  node: Heading,
  usedHeadingIds: Map<string, number>,
  toc: ArticleTocEntry[] | null,
): MdxBlock {
  const level: 2 | 3 | 4 = node.depth <= 2 ? 2 : node.depth === 3 ? 3 : 4
  const inlines = convertPhrasingNodes(node.children)
  const plainText = extractPlainTextFromInlines(inlines)
  const id = createHeadingSlug(plainText, usedHeadingIds)

  if (toc) {
    toc.push({ id, text: plainText, level })
  }

  return {
    type: 'heading',
    level,
    id,
    inlines,
    plainText,
  }
}

function convertCodeNode(node: Code): MdxBlock {
  return {
    type: 'code',
    language: node.lang?.trim() || 'typescript',
    title: parseCodeMetaTitle(node.meta),
    code: node.value,
  }
}

function convertTableNode(node: Table): MdxBlock {
  const headerRow = node.children[0]
  const bodyRows = node.children.slice(1)
  const headers: MdxInlineNode[][] = headerRow
    ? headerRow.children.map((cell) => convertPhrasingNodes(cell.children))
    : []

  const alignments: Array<'left' | 'center' | 'right'> = headers.map((_, idx) => {
    const align = node.align?.[idx]
    if (align === 'center' || align === 'right') return align
    return 'left'
  })

  const rows: MdxInlineNode[][][] = bodyRows.map((row) =>
    row.children.map((cell) => convertPhrasingNodes(cell.children)),
  )

  return {
    type: 'table',
    headers,
    alignments,
    rows,
  }
}

function convertListNode(node: List, usedHeadingIds: Map<string, number>): MdxBlock {
  const items: MdxListItemNode[] = node.children.map((listItem) => ({
    checked: listItem.checked === null ? undefined : listItem.checked,
    blocks: convertMdastChildren(listItem.children, usedHeadingIds, null),
  }))

  return {
    type: 'list',
    ordered: Boolean(node.ordered),
    items,
  }
}

function convertBlockquoteNode(node: Blockquote, usedHeadingIds: Map<string, number>): MdxBlock {
  const firstChild = node.children[0]

  // Check for GitHub Alert syntax: > [!NOTE] Optional Title
  if (firstChild && firstChild.type === 'paragraph' && firstChild.children[0]?.type === 'text') {
    const firstTextNode = firstChild.children[0]
    const rawValue = firstTextNode.value
    const newlineIdx = rawValue.indexOf('\n')
    const firstLine = (newlineIdx === -1 ? rawValue : rawValue.slice(0, newlineIdx)).trim()
    const alertMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i)

    if (alertMatch) {
      const kind = (alertMatch[1] ?? 'note').toLowerCase() as MdxCalloutKind
      const customTitle = (alertMatch[2] ?? '').trim() || undefined
      const remainingSameText = newlineIdx === -1 ? '' : rawValue.slice(newlineIdx + 1).trimStart()

      const clonedParagraphChildren: PhrasingContent[] = []
      if (remainingSameText) {
        clonedParagraphChildren.push({ type: 'text', value: remainingSameText })
      }
      for (const sibling of firstChild.children.slice(1)) {
        // Strip leading soft break right after [!ALERT] header line
        if (clonedParagraphChildren.length === 0 && sibling.type === 'break') {
          continue
        }
        clonedParagraphChildren.push(sibling)
      }

      const modifiedBlockChildren: Content[] = []
      if (clonedParagraphChildren.length > 0) {
        modifiedBlockChildren.push({
          type: 'paragraph',
          children: clonedParagraphChildren,
        })
      }
      modifiedBlockChildren.push(...node.children.slice(1))

      return {
        type: 'callout',
        kind,
        title: customTitle,
        blocks: convertMdastChildren(modifiedBlockChildren, usedHeadingIds, null),
      }
    }
  }

  return {
    type: 'callout',
    kind: 'quote',
    blocks: convertMdastChildren(node.children, usedHeadingIds, null),
  }
}

function convertMdastChildren(
  children: readonly Content[],
  usedHeadingIds: Map<string, number>,
  toc: ArticleTocEntry[] | null,
): MdxBlock[] {
  const blocks: MdxBlock[] = []

  for (const child of children) {
    switch (child.type) {
      case 'heading':
        blocks.push(convertHeadingNode(child, usedHeadingIds, toc))
        break
      case 'paragraph': {
        const converted = convertParagraphNode(child)
        if (converted) blocks.push(converted)
        break
      }
      case 'code':
        blocks.push(convertCodeNode(child))
        break
      case 'table':
        blocks.push(convertTableNode(child))
        break
      case 'list':
        blocks.push(convertListNode(child, usedHeadingIds))
        break
      case 'blockquote':
        blocks.push(convertBlockquoteNode(child, usedHeadingIds))
        break
      case 'thematicBreak':
        blocks.push({ type: 'hr' })
        break
      case 'html': {
        const widget = parseCustomWidgetTag(child.value)
        if (widget) {
          blocks.push({ type: 'component', name: widget.name, props: widget.props })
        }
        break
      }
      default:
        break
    }
  }

  return blocks
}

function extractStringArray(rawField: unknown): string[] {
  if (Array.isArray(rawField)) {
    return rawField.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof rawField === 'string' && rawField.trim()) {
    return rawField
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function formatPublishedDate(rawDate: unknown): string {
  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate.toISOString().slice(0, 10)
  }
  if (typeof rawDate === 'string' && rawDate.trim()) {
    return rawDate.trim()
  }
  return '2026-10-15'
}

function parseRawMdx(
  raw: string,
  fallbackCategory: KnowledgeCategory,
  leafSlug: string,
  relativeSubSegments: readonly string[],
  locale: SupportedLocale,
  isFallback: boolean,
): MdxArticleDocument {
  const parsedMatter = matter(raw)
  const meta = parsedMatter.data as Record<string, unknown>

  const parsedCategory = KnowledgeCategoryEnum.safeParse(meta.category)
  const category = parsedCategory.success ? parsedCategory.data : fallbackCategory
  const parsedFormat = KnowledgeNoteFormatEnum.safeParse(meta.format)
  const format: KnowledgeNoteFormat = parsedFormat.success ? parsedFormat.data : 'deep-dive'

  const pathSegments = [category, ...relativeSubSegments, leafSlug]
  const routePath = pathSegments.join('/')
  const metricSlug =
    typeof meta.metricSlug === 'string' && meta.metricSlug.trim()
      ? meta.metricSlug.trim()
      : relativeSubSegments.length === 0
        ? leafSlug
        : pathSegments.join('--')

  const rawOrder = typeof meta.order === 'number' ? meta.order : Number.parseInt(String(meta.order ?? ''), 10)
  const order = Number.isFinite(rawOrder) ? rawOrder : 999

  const rawTags = extractStringArray(meta.tags)
  const tags: string[] = []
  for (const rawTag of rawTags) {
    const normalized = normalizeTag(rawTag)
    if (normalized && !tags.includes(normalized)) {
      tags.push(normalized)
    }
  }

  const tldr = extractStringArray(meta.tldr)

  const mdastRoot = markdownProcessor.parse(parsedMatter.content) as Root
  const toc: ArticleTocEntry[] = []
  const usedHeadingIds = new Map<string, number>()
  const blocks = convertMdastChildren(mdastRoot.children, usedHeadingIds, toc)

  const resolvedTitle = typeof meta.title === 'string' && meta.title.trim() ? meta.title.trim() : leafSlug
  const sidebarLabel =
    typeof meta.sidebarLabel === 'string' && meta.sidebarLabel.trim() ? meta.sidebarLabel.trim() : resolvedTitle
  const summary = typeof meta.summary === 'string' ? meta.summary.trim() : ''
  const readingTime =
    typeof meta.readingTime === 'string' && meta.readingTime.trim()
      ? meta.readingTime.trim()
      : typeof meta.readTime === 'string' && meta.readTime.trim()
        ? meta.readTime.trim()
        : '5 min'

  return {
    slug: metricSlug,
    leafSlug,
    category,
    pathSegments,
    routePath,
    locale,
    isFallback,
    title: resolvedTitle,
    sidebarLabel,
    summary,
    readingTime,
    publishedAt: formatPublishedDate(meta.publishedAt),
    order,
    format,
    tags,
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
    format: doc.format,
    tags: doc.tags,
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

export interface KnowledgeSearchItem {
  routePath: string
  title: string
  sidebarLabel: string
  summary: string
  category: KnowledgeCategory
  topicLabel: string
  subtopicLabel: string
  format: KnowledgeNoteFormat
  tags: string[]
  readingTime: string
  headings: Array<{ id: string; text: string }>
}

export const getKnowledgeSearchIndex = cache((localeInput?: string): KnowledgeSearchItem[] => {
  const locale = normalizeLocale(localeInput)
  const docs = getAllKnowledgeArticles(locale)

  return docs.map((doc) => {
    const subSegments = doc.pathSegments.slice(1, -1)
    const subtopicLabel = subSegments.map((seg) => formatKnowledgeSegmentLabel(seg, locale)).join(' / ')

    return {
      routePath: doc.routePath,
      title: doc.title,
      sidebarLabel: doc.sidebarLabel,
      summary: doc.summary,
      category: doc.category,
      topicLabel: formatKnowledgeSegmentLabel(doc.category, locale),
      subtopicLabel,
      format: doc.format,
      tags: doc.tags,
      readingTime: doc.readingTime,
      headings: doc.toc.filter((h) => h.level === 2 || h.level === 3).map((h) => ({ id: h.id, text: h.text })),
    }
  })
})

export const getAllKnowledgeTags = cache((localeInput?: string): Array<{ tag: string; count: number }> => {
  const docs = getAllKnowledgeArticles(localeInput)
  const counts = new Map<string, number>()

  for (const doc of docs) {
    for (const tag of doc.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
})

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
