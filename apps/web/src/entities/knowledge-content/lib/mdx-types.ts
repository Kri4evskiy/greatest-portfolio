import type { KnowledgeCategory, KnowledgeNoteFormat, KnowledgeSearchItem, SupportedLocale } from '@repo/shared-schemas'
import type { Root as HastRoot } from 'hast'

export type { HastRoot, KnowledgeSearchItem }

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

export const SUPPORTED_MDX_WIDGETS = new Set<MdxWidgetName>([
  'ReactRenderGraphD3',
  'ArchitectureFlowD3',
  'ArticleImageGrid',
  'NestAiMcpDiagram',
])

export interface MdxCodeBlockMeta {
  id: string
  language: string
  title?: string | undefined
  code: string
}

export interface MdxArticleDocument extends MdxArticleFrontmatter {
  toc: ArticleTocEntry[]
  hast: HastRoot
  codeBlocks: MdxCodeBlockMeta[]
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
