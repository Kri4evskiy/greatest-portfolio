import type { KnowledgeCategory, KnowledgeNoteFormat, SupportedLocale } from '@repo/shared-schemas'

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
