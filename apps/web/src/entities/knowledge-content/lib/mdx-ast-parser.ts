import {
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type KnowledgeNoteFormat,
  KnowledgeNoteFormatEnum,
  type SupportedLocale,
} from '@repo/shared-schemas'
import matter from 'gray-matter'
import type { Blockquote, Code, Content, Heading, List, Paragraph, PhrasingContent, Root, Table } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import {
  type ArticleTocEntry,
  type MdxArticleDocument,
  type MdxBlock,
  type MdxCalloutKind,
  type MdxInlineNode,
  type MdxListItemNode,
  type MdxWidgetName,
  SUPPORTED_MDX_WIDGETS,
} from './mdx-types'

const markdownProcessor = unified().use(remarkParse).use(remarkGfm)

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

export function parseRawMdx(
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
