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

export interface MdxArticleFrontmatter {
  /** Safe metric key without slashes for API/DB views & helpful reactions */
  slug: string
  /** Leaf filename without locale suffix or .mdx extension */
  leafSlug: string
  /** Root category (first segment) */
  category: KnowledgeCategory
  /** Full path segments under /knowledge-base, e.g. ['this-project', 'monorepo-docker', 'pnpm12-buildkit'] */
  pathSegments: string[]
  /** Joined URL route path: 'this-project/monorepo-docker/pnpm12-buildkit' */
  routePath: string
  locale: SupportedLocale
  isFallback: boolean
  title: string
  summary: string
  readingTime: string
  publishedAt: string
  order: number
}

export type MdxBlock =
  | { type: 'h2'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'component'; name: 'ReactRenderGraphD3' | 'ArchitectureFlowD3' | 'ArticleImageGrid' }

export interface MdxArticleDocument extends MdxArticleFrontmatter {
  blocks: MdxBlock[]
}

export interface KnowledgeTreeFolderNode {
  type: 'folder'
  pathKey: string
  segment: string
  label: string
  pathSegments: string[]
  articleCount: number
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

function parseRawMdx(
  raw: string,
  fallbackCategory: KnowledgeCategory,
  leafSlug: string,
  relativeSubSegments: readonly string[],
  locale: SupportedLocale,
  isFallback: boolean,
): MdxArticleDocument {
  let body = raw.trim()
  const meta: Record<string, string> = {}

  if (body.startsWith('---')) {
    const endIdx = body.indexOf('---', 3)
    if (endIdx !== -1) {
      const frontmatterLines = body.slice(3, endIdx).trim().split(/\r?\n/)
      for (const line of frontmatterLines) {
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim()
          const val = line
            .slice(colonIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, '')
          meta[key] = val
        }
      }
      body = body.slice(endIdx + 3).trim()
    }
  }

  const parsedCategory = KnowledgeCategoryEnum.safeParse(meta.category)
  const category = parsedCategory.success ? parsedCategory.data : fallbackCategory
  const pathSegments = [category, ...relativeSubSegments, leafSlug]
  const routePath = pathSegments.join('/')
  const metricSlug = relativeSubSegments.length === 0 ? leafSlug : pathSegments.join('--')
  const parsedOrder = meta.order ? Number.parseInt(meta.order, 10) : Number.NaN

  const lines = body.split(/\r?\n/)
  const blocks: MdxBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = (lines[i] ?? '').trim()

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

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      i += 1
      continue
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'typescript'
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[i] ?? '')
        i += 1
      }
      i += 1
      blocks.push({ type: 'code', language, code: codeLines.join('\n') })
      continue
    }

    if (line.startsWith('- ') || /^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (
        i < lines.length &&
        ((lines[i] ?? '').trim().startsWith('- ') || /^\d+\.\s/.test((lines[i] ?? '').trim()))
      ) {
        const cleaned = (lines[i] ?? '')
          .trim()
          .replace(/^-\s+/, '')
          .replace(/^\d+\.\s+/, '')
        items.push(cleaned)
        i += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    blocks.push({ type: 'paragraph', text: line })
    i += 1
  }

  return {
    slug: metricSlug,
    leafSlug,
    category,
    pathSegments,
    routePath,
    locale,
    isFallback,
    title: meta.title ?? leafSlug,
    summary: meta.summary ?? '',
    readingTime: meta.readingTime ?? '5 min',
    publishedAt: meta.publishedAt ?? '2026-10-15',
    order: Number.isFinite(parsedOrder) ? parsedOrder : 999,
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
    summary: doc.summary,
    readingTime: doc.readingTime,
    publishedAt: doc.publishedAt,
    order: doc.order,
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
      return a.label.localeCompare(b.label)
    }
    if (a.type === 'article' && b.type === 'article') {
      return a.article.order - b.article.order || a.article.title.localeCompare(b.article.title)
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
