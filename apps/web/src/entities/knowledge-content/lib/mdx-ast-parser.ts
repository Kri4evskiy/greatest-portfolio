import {
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type KnowledgeNoteFormat,
  KnowledgeNoteFormatEnum,
  type SupportedLocale,
} from '@repo/shared-schemas'
import matter from 'gray-matter'
import type { Root as HastRoot } from 'hast'
import type { Blockquote, Code, Heading, List, Root as MdastRoot, Paragraph, PhrasingContent, RootContent } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import {
  type ArticleTocEntry,
  type MdxArticleDocument,
  type MdxArticleFrontmatter,
  type MdxCalloutKind,
  type MdxCodeBlockMeta,
  type MdxWidgetName,
  SUPPORTED_MDX_WIDGETS,
} from './mdx-types'

const markdownParser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)
const mdastToHastProcessor = unified().use(remarkRehype)

interface DirectiveMdastNode {
  type: 'leafDirective' | 'containerDirective' | 'textDirective'
  name?: string | undefined
  attributes?: Record<string, string | null | undefined> | null | undefined
  children?: RootContent[] | undefined
  data?: Record<string, unknown> | undefined
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

function extractPlainTextFromMdast(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const record = node as { type?: string; value?: string; alt?: string; children?: unknown[] }

  if (record.type === 'text' || record.type === 'inlineCode' || record.type === 'code') {
    return record.value ?? ''
  }
  if (record.type === 'image') {
    return record.alt ?? ''
  }
  if (record.type === 'break') {
    return ' '
  }
  if (Array.isArray(record.children)) {
    return record.children.map(extractPlainTextFromMdast).join('').trim()
  }
  return ''
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

function parseDirectiveWidget(
  node: DirectiveMdastNode,
): { name: MdxWidgetName; props: Record<string, string>; payload?: string | undefined } | null {
  const rawDirectiveName = (node.name ?? '').trim()
  if (!rawDirectiveName) return null

  const attrs = node.attributes ?? {}
  let candidateName: string | undefined

  if (rawDirectiveName === 'sandbox' || rawDirectiveName === 'widget') {
    candidateName = (attrs.name ?? attrs.widget ?? '')?.trim()
  } else {
    candidateName = rawDirectiveName
  }

  if (!candidateName || !SUPPORTED_MDX_WIDGETS.has(candidateName as MdxWidgetName)) {
    return null
  }

  const props: Record<string, string> = {}
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'name' || key === 'widget') continue
    if (typeof val === 'string') {
      props[key] = val
    }
  }

  const payload = Array.isArray(node.children) ? extractPlainTextFromMdast(node).trim() : ''
  return {
    name: candidateName as MdxWidgetName,
    props,
    ...(payload ? { payload } : {}),
  }
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

function normalizeInlinePhrasingNodes(children: PhrasingContent[]): void {
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i]
    if (!child) continue

    if (child.type === 'html') {
      const trimmed = child.value.trim()
      if (/^<br\s*\/?>$/i.test(trimmed)) {
        children[i] = { type: 'break' }
      } else {
        children[i] = { type: 'text', value: child.value }
      }
      continue
    }

    if ('children' in child && Array.isArray(child.children)) {
      normalizeInlinePhrasingNodes(child.children as PhrasingContent[])
    }
  }
}

function decorateHeadingNode(node: Heading, usedHeadingIds: Map<string, number>, toc: ArticleTocEntry[] | null): void {
  const level: 2 | 3 | 4 = node.depth <= 2 ? 2 : node.depth === 3 ? 3 : 4
  node.depth = level
  normalizeInlinePhrasingNodes(node.children)
  const plainText = extractPlainTextFromMdast(node)
  const id = createHeadingSlug(plainText, usedHeadingIds)

  if (toc) {
    toc.push({ id, text: plainText, level })
  }

  node.data = {
    ...node.data,
    hProperties: {
      id,
      'data-heading-text': plainText,
    },
  }
}

function decorateParagraphNode(node: Paragraph): void {
  if (node.children.length === 1 && node.children[0]?.type === 'image') {
    const img = node.children[0]
    const caption = img.title ?? (img.alt || undefined)
    node.data = {
      hName: 'figure',
      hProperties: {
        'data-figure-src': img.url,
        'data-figure-alt': img.alt ?? '',
        ...(caption ? { 'data-figure-caption': caption } : {}),
      },
    }
    node.children = []
    return
  }

  normalizeInlinePhrasingNodes(node.children)
}

function decorateCodeNode(node: Code, codeBlocks: MdxCodeBlockMeta[]): void {
  const codeId = `code-${codeBlocks.length}`
  const language = node.lang?.trim() || 'typescript'
  const title = parseCodeMetaTitle(node.meta)

  codeBlocks.push({
    id: codeId,
    language,
    title,
    code: node.value,
  })

  node.data = {
    hName: 'pre',
    hProperties: {
      'data-code-id': codeId,
      'data-language': language,
      ...(title ? { 'data-title': title } : {}),
    },
  }
}

function decorateBlockquoteNode(
  node: Blockquote,
  usedHeadingIds: Map<string, number>,
  codeBlocks: MdxCodeBlockMeta[],
): void {
  const firstChild = node.children[0]
  let kind: MdxCalloutKind = 'quote'
  let customTitle: string | undefined

  if (firstChild && firstChild.type === 'paragraph' && firstChild.children[0]?.type === 'text') {
    const firstTextNode = firstChild.children[0]
    const rawValue = firstTextNode.value
    const newlineIdx = rawValue.indexOf('\n')
    const firstLine = (newlineIdx === -1 ? rawValue : rawValue.slice(0, newlineIdx)).trim()
    const alertMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i)

    if (alertMatch) {
      kind = (alertMatch[1] ?? 'note').toLowerCase() as MdxCalloutKind
      customTitle = (alertMatch[2] ?? '').trim() || undefined
      const remainingSameText = newlineIdx === -1 ? '' : rawValue.slice(newlineIdx + 1).trimStart()

      const clonedParagraphChildren: PhrasingContent[] = []
      if (remainingSameText) {
        clonedParagraphChildren.push({ type: 'text', value: remainingSameText })
      }
      for (const sibling of firstChild.children.slice(1)) {
        if (
          clonedParagraphChildren.length === 0 &&
          (sibling.type === 'break' || (sibling.type === 'html' && /^<br\s*\/?>$/i.test(sibling.value.trim())))
        ) {
          continue
        }
        clonedParagraphChildren.push(sibling)
      }

      const modifiedBlockChildren: RootContent[] = []
      if (clonedParagraphChildren.length > 0) {
        modifiedBlockChildren.push({
          type: 'paragraph',
          children: clonedParagraphChildren,
        })
      }
      modifiedBlockChildren.push(...node.children.slice(1))
      node.children = modifiedBlockChildren as Blockquote['children']
    }
  }

  transformMdastChildren(node.children, usedHeadingIds, null, codeBlocks, true)

  node.data = {
    hName: 'blockquote',
    hProperties: {
      'data-callout-kind': kind,
      ...(customTitle ? { 'data-callout-title': customTitle } : {}),
    },
  }
}

function decorateListNode(
  node: List,
  usedHeadingIds: Map<string, number>,
  codeBlocks: MdxCodeBlockMeta[],
  isNested: boolean,
): void {
  if (isNested) {
    node.data = {
      ...node.data,
      hProperties: {
        'data-nested-list': 'true',
      },
    }
  }

  for (const listItem of node.children) {
    if (listItem.checked !== null && listItem.checked !== undefined) {
      const isChecked = listItem.checked
      listItem.checked = null
      listItem.data = {
        ...listItem.data,
        hProperties: {
          'data-task-checked': isChecked ? 'true' : 'false',
        },
      }
    }

    transformMdastChildren(listItem.children, usedHeadingIds, null, codeBlocks, true)
  }
}

function transformMdastChildren(
  children: RootContent[],
  usedHeadingIds: Map<string, number>,
  toc: ArticleTocEntry[] | null,
  codeBlocks: MdxCodeBlockMeta[],
  isNested = false,
): void {
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i]
    if (!child) continue

    switch (child.type) {
      case 'heading':
        decorateHeadingNode(child, usedHeadingIds, toc)
        break

      case 'paragraph':
        decorateParagraphNode(child)
        break

      case 'code':
        decorateCodeNode(child, codeBlocks)
        break

      case 'blockquote':
        decorateBlockquoteNode(child, usedHeadingIds, codeBlocks)
        break

      case 'list':
        decorateListNode(child, usedHeadingIds, codeBlocks, isNested)
        break

      case 'table':
        for (const row of child.children) {
          row.children.forEach((cell, colIdx) => {
            const align = child.align?.[colIdx]
            if (align) {
              cell.data = {
                ...cell.data,
                hProperties: {
                  'data-align': align,
                },
              }
            }
            normalizeInlinePhrasingNodes(cell.children)
          })
        }
        break

      case 'html': {
        const widget = parseCustomWidgetTag(child.value)
        if (widget) {
          const replacement: Paragraph = {
            type: 'paragraph',
            children: [],
            data: {
              hName: 'div',
              hProperties: {
                'data-mdx-widget': widget.name,
                'data-widget-props': JSON.stringify(widget.props),
              },
            },
          }
          children[i] = replacement
        } else {
          // Strip arbitrary raw HTML blocks that are not registered widgets (Zero-Eval / XSS defense)
          children[i] = { type: 'paragraph', children: [] }
        }
        break
      }

      default: {
        const maybeDirective = child as unknown as DirectiveMdastNode
        if (maybeDirective.type === 'leafDirective' || maybeDirective.type === 'containerDirective') {
          const widget = parseDirectiveWidget(maybeDirective)
          if (widget) {
            const replacement: Paragraph = {
              type: 'paragraph',
              children: [],
              data: {
                hName: 'div',
                hProperties: {
                  'data-mdx-widget': widget.name,
                  'data-widget-props': JSON.stringify(widget.props),
                  ...(widget.payload ? { 'data-widget-payload': widget.payload } : {}),
                },
              },
            }
            children[i] = replacement
          }
        }
        break
      }
    }
  }
}

export function parseInlineMarkdownToHast(raw: string): HastRoot {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { type: 'root', children: [] }
  }

  const mdastTree = markdownParser.parse(trimmed) as MdastRoot
  const firstChild = mdastTree.children[0]
  if (firstChild && firstChild.type === 'paragraph') {
    normalizeInlinePhrasingNodes(firstChild.children)
    const inlineRoot: MdastRoot = {
      type: 'root',
      children: firstChild.children as unknown as RootContent[],
    }
    return mdastToHastProcessor.runSync(inlineRoot) as HastRoot
  }

  return mdastToHastProcessor.runSync(mdastTree) as HastRoot
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

export function parseFrontmatterOnly(
  raw: string,
  fallbackCategory: KnowledgeCategory,
  leafSlug: string,
  relativeSubSegments: readonly string[],
  locale: SupportedLocale,
  isFallback: boolean,
): { frontmatter: MdxArticleFrontmatter; content: string } {
  // Explicitly disable gray-matter's legacy `js`/`javascript` eval engines (defense-in-depth RCE guard)
  const parsedMatter = matter(raw, {
    engines: {
      js: () => ({}),
      javascript: () => ({}),
    },
  })
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
    frontmatter: {
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
    },
    content: parsedMatter.content,
  }
}

export function parseRawMdx(
  raw: string,
  fallbackCategory: KnowledgeCategory,
  leafSlug: string,
  relativeSubSegments: readonly string[],
  locale: SupportedLocale,
  isFallback: boolean,
): MdxArticleDocument {
  const { frontmatter, content } = parseFrontmatterOnly(
    raw,
    fallbackCategory,
    leafSlug,
    relativeSubSegments,
    locale,
    isFallback,
  )

  const mdastRoot = markdownParser.parse(content) as MdastRoot
  const toc: ArticleTocEntry[] = []
  const codeBlocks: MdxCodeBlockMeta[] = []
  const usedHeadingIds = new Map<string, number>()

  transformMdastChildren(mdastRoot.children, usedHeadingIds, toc, codeBlocks, false)
  const hast = mdastToHastProcessor.runSync(mdastRoot) as HastRoot

  return {
    ...frontmatter,
    toc,
    hast,
    codeBlocks,
  }
}
