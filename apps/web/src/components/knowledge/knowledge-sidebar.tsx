'use client'

import { Badge } from '@repo/ui'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Folder,
  FolderOpen,
  Layers,
  PanelLeft,
  Sparkles,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import type { KnowledgeTreeFolderNode, KnowledgeTreeNode } from '@/lib/mdx-content'
import { useUIStore } from '@/store/use-ui-store'

function collectAllFolderKeys(nodes: readonly KnowledgeTreeNode[]): string[] {
  const keys: string[] = []
  const walk = (list: readonly KnowledgeTreeNode[]) => {
    for (const item of list) {
      if (item.type === 'folder') {
        keys.push(item.pathKey)
        walk(item.children)
      }
    }
  }
  walk(nodes)
  return keys
}

interface KnowledgeTreeItemProps {
  node: KnowledgeTreeNode
  depth: number
  pathname: string
  closeOnSelect: boolean
  onSelectLeaf: () => void
}

function KnowledgeTreeItem({ node, depth, pathname, closeOnSelect, onSelectLeaf }: KnowledgeTreeItemProps) {
  const expandedFolders = useUIStore((s) => s.expandedKbFolders)
  const toggleFolder = useUIStore((s) => s.toggleKbFolder)

  // Level 3 (or deepest leaf): Article inside a Subtopic
  if (node.type === 'article') {
    const href = `/knowledge-base/${node.article.routePath}`
    const isActive = pathname === href
    return (
      <Link
        href={href}
        title={node.article.title}
        onClick={() => {
          if (closeOnSelect) onSelectLeaf()
        }}
        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
          isActive
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
            isActive ? 'bg-primary' : 'bg-border group-hover:bg-muted-foreground/70'
          }`}
        />
        <span className="truncate">{node.article.sidebarLabel}</span>
      </Link>
    )
  }

  // Level 1 (Root Topic, e.g. React) or Level 2+ (Subtopic, e.g. React Compiler)
  const folderHref = `/knowledge-base/${node.pathKey}`
  const isExactFolderActive = pathname === folderHref
  const isInsideBranch = isExactFolderActive || pathname.startsWith(`${folderHref}/`)
  const isExpanded = expandedFolders[node.pathKey] ?? false
  const isThisProjectRoot = depth === 0 && node.segment === 'this-project'

  const renderLevelIcon = () => {
    if (isThisProjectRoot) {
      return <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
    }
    if (depth === 0) {
      return <Layers className={`h-3.5 w-3.5 shrink-0 ${isInsideBranch ? 'text-primary' : 'text-muted-foreground'}`} />
    }
    return isExpanded ? (
      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/80" />
    ) : (
      <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    )
  }

  return (
    <div className="space-y-0.5">
      <div
        className={`group flex items-center justify-between gap-1 rounded-md pr-1.5 py-0.5 transition-colors ${
          isExactFolderActive
            ? 'bg-primary/10 font-semibold text-primary'
            : isInsideBranch
              ? 'bg-muted/40 text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        {/* Arrow button: expands/collapses the tree branch in-place */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={`Toggle ${node.label}`}
          onClick={() => toggleFolder(node.pathKey)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-muted"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Clicking the Topic or Subtopic name BOTH expands the branch AND opens its Topic/Subtopic hub with tabs */}
        <Link
          href={folderHref}
          onClick={() => {
            if (!isExpanded || isExactFolderActive) {
              toggleFolder(node.pathKey)
            }
            if (closeOnSelect) onSelectLeaf()
          }}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
        >
          {renderLevelIcon()}
          <span
            className={`truncate ${
              depth === 0 ? 'text-[13px] font-semibold tracking-tight text-foreground' : 'text-xs font-medium'
            }`}
          >
            {node.label}
          </span>
        </Link>

        <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {node.articleCount}
        </span>
      </div>

      {isExpanded ? (
        <div className="ml-[11px] space-y-0.5 border-l border-border/70 pl-2.5 pt-0.5">
          {node.children.map((child) => (
            <KnowledgeTreeItem
              key={child.pathKey}
              node={child}
              depth={depth + 1}
              pathname={pathname}
              closeOnSelect={closeOnSelect}
              onSelectLeaf={onSelectLeaf}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function KnowledgeSidebar({
  tree,
  totalArticles,
}: {
  tree: readonly KnowledgeTreeFolderNode[]
  totalArticles: number
}) {
  const t = useTranslations('KnowledgeBase')
  const pathname = usePathname()
  const expandedFolders = useUIStore((s) => s.expandedKbFolders)
  const expandKbAncestors = useUIStore((s) => s.expandKbAncestors)
  const collapseAllKbFolders = useUIStore((s) => s.collapseAllKbFolders)
  const expandAllKbFolders = useUIStore((s) => s.expandAllKbFolders)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const allFolderKeys = useMemo(() => collectAllFolderKeys(tree), [tree])
  const hasAnyExpanded = useMemo(
    () => allFolderKeys.some((key) => Boolean(expandedFolders[key])),
    [allFolderKeys, expandedFolders],
  )

  // Automatically expand only the active ancestor chain when opening a Topic, Subtopic, or Article
  useEffect(() => {
    if (!pathname.startsWith('/knowledge-base/')) return
    const rel = pathname.slice('/knowledge-base/'.length)
    const segments = rel.split('/').filter(Boolean)
    if (segments.length === 0) return

    const folderKeySet = new Set(allFolderKeys)
    const ancestorKeys: string[] = []
    for (let i = 0; i < segments.length; i += 1) {
      const candidate = segments.slice(0, i + 1).join('/')
      if (folderKeySet.has(candidate)) {
        ancestorKeys.push(candidate)
      }
    }
    if (ancestorKeys.length > 0) {
      expandKbAncestors(ancestorKeys)
    }
  }, [pathname, allFolderKeys, expandKbAncestors])

  const renderTreeContent = (closeOnSelect: boolean) => (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-1 border-b border-border/60 pb-2.5">
        <Link
          href="/knowledge-base"
          onClick={() => {
            if (closeOnSelect) setIsMobileOpen(false)
          }}
          className={`flex min-w-0 flex-1 items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            pathname === '/knowledge-base' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t('sidebarOverview')}</span>
          </span>
          <span
            className={`ml-2 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
              pathname === '/knowledge-base'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {totalArticles}
          </span>
        </Link>

        <button
          type="button"
          title={hasAnyExpanded ? t('collapseAllTree') : t('expandAllTree')}
          aria-label={hasAnyExpanded ? t('collapseAllTree') : t('expandAllTree')}
          onClick={() => {
            if (hasAnyExpanded) {
              collapseAllKbFolders()
            } else {
              expandAllKbFolders(allFolderKeys)
            }
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {hasAnyExpanded ? <ChevronsDownUp className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <nav aria-label={t('sidebarNavTitle')} className="space-y-1">
        {tree.map((rootNode) => (
          <KnowledgeTreeItem
            key={rootNode.pathKey}
            node={rootNode}
            depth={0}
            pathname={pathname}
            closeOnSelect={closeOnSelect}
            onSelectLeaf={() => setIsMobileOpen(false)}
          />
        ))}
      </nav>
    </div>
  )

  return (
    <aside className="w-full shrink-0 md:sticky md:top-20 md:w-64 lg:w-72">
      {/* Mobile collapsible navigation trigger — closed by default so content starts immediately */}
      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50"
        >
          <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-muted-foreground">
            <PanelLeft className="h-3.5 w-3.5 text-primary" />
            <span>{t('sidebarNavTitle')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {totalArticles} MDX
            </Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${isMobileOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {isMobileOpen ? <div className="mt-2">{renderTreeContent(true)}</div> : null}
      </div>

      {/* Desktop sticky sidebar rail (>= md) */}
      <div className="hidden max-h-[calc(100dvh-6rem)] overflow-y-auto md:block">{renderTreeContent(false)}</div>
    </aside>
  )
}
