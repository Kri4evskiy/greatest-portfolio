import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_LOCALE,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type SupportedLocale,
  SupportedLocaleEnum,
} from '@repo/shared-schemas'
import { cache } from 'react'

export interface MdxArticleFrontmatter {
  slug: string
  category: KnowledgeCategory
  locale: SupportedLocale
  isFallback: boolean
  title: string
  summary: string
  readingTime: string
  publishedAt: string
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
  slug: string,
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
    slug,
    category,
    locale,
    isFallback,
    title: meta.title ?? slug,
    summary: meta.summary ?? '',
    readingTime: meta.readingTime ?? '5 min',
    publishedAt: meta.publishedAt ?? '2026-10-15',
    blocks,
  }
}

function normalizeLocale(localeInput?: string): SupportedLocale {
  const parsed = SupportedLocaleEnum.safeParse(localeInput)
  return parsed.success ? parsed.data : DEFAULT_LOCALE
}

export const getAllKnowledgeArticles = cache((localeInput?: string): MdxArticleDocument[] => {
  const requestedLocale = normalizeLocale(localeInput)
  const root = resolveContentRoot()
  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]
  const articles: MdxArticleDocument[] = []

  for (const category of categories) {
    const categoryDir = join(root, category)
    if (!existsSync(categoryDir)) continue

    const files = readdirSync(categoryDir).filter((f) => f.endsWith('.mdx'))
    const uniqueSlugs = Array.from(new Set(files.map(extractBaseSlug)))

    for (const slug of uniqueSlugs) {
      const exactCandidate = join(categoryDir, `${slug}.${requestedLocale}.mdx`)
      const defaultLocaleCandidate = join(categoryDir, `${slug}.${DEFAULT_LOCALE}.mdx`)
      const legacyCandidate = join(categoryDir, `${slug}.mdx`)

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
        articles.push(parseRawMdx(raw, category, slug, resolvedLocale, isFallback))
      }
    }
  }

  return articles
})

export const getArticleByCategoryAndSlug = cache(
  (category: string, slug: string, localeInput?: string): MdxArticleDocument | null => {
    const all = getAllKnowledgeArticles(localeInput)
    return all.find((a) => a.category === category && a.slug === slug) ?? null
  },
)
