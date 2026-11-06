'use client'

import { Badge } from '@repo/ui'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderGit2,
  FolderOpen,
  PanelLeft,
  Sparkles,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import type { KnowledgeTreeFolderNode, KnowledgeTreeNode } from '@/lib/mdx-content'
import { useUIStore } from '@/store/use-ui-store'

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

  if (node.type === 'article') {
    const href = `/knowledge-base/${node.article.routePath}`
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={() => {
          if (closeOnSelect) onSelectLeaf()
        }}
        className={`group flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
          isActive
            ? 'bg-accent font-semibold text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
      >
        <FileText
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-colors ${
            isActive ? 'text-primary' : 'opacity-60 group-hover:opacity-100'
          }`}
        />
        <span className="line-clamp-2 leading-snug">{node.article.title}</span>
      </Link>
    )
  }

  const folderHref = `/knowledge-base/${node.pathKey}`
  const isExactFolderActive = pathname === folderHref
  const isInsideBranch = isExactFolderActive || pathname.startsWith(`${folderHref}/`)
  const isExpanded = expandedFolders[node.pathKey] ?? depth === 0
  const isThisProjectRoot = depth === 0 && node.segment === 'this-project'

  const renderFolderIcon = () => {
    if (isThisProjectRoot) {
      return <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
    }
    if (depth === 0) {
      return <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-primary" />
    }
    return isExpanded ? (
      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/90" />
    ) : (
      <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    )
  }

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center justify-between gap-1 rounded-md pr-1.5 transition-colors ${
          isExactFolderActive
            ? 'bg-accent text-foreground'
            : isInsideBranch
              ? 'text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={`Toggle ${node.label}`}
          onClick={() => toggleFolder(node.pathKey)}
          className="flex h-7 w-6 shrink-0 items-center justify-center rounded hover:bg-muted"
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <Link
          href={folderHref}
          onClick={() => {
            if (!isExpanded) {
              toggleFolder(node.pathKey)
            }
            if (closeOnSelect) onSelectLeaf()
          }}
          className={`flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left ${
            depth === 0 ? 'font-mono text-[11px] font-semibold uppercase tracking-wider' : 'text-xs font-medium'
          }`}
        >
          {renderFolderIcon()}
          <span className="truncate">{node.label}</span>
        </Link>

        <span className="shrink-0 rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {node.articleCount}
        </span>
      </div>

      {isExpanded ? (
        <div className="ml-3 space-y-1 border-l border-border/70 pl-2.5">
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
  const expandKbAncestors = useUIStore((s) => s.expandKbAncestors)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Automatically expand ancestor folders whenever the user navigates to a deeply nested URL
  useEffect(() => {
    if (!pathname.startsWith('/knowledge-base/')) return
    const rel = pathname.slice('/knowledge-base/'.length)
    const segments = rel.split('/').filter(Boolean)
    if (segments.length === 0) return

    const ancestorKeys: string[] = []
    for (let i = 0; i < segments.length; i += 1) {
      ancestorKeys.push(segments.slice(0, i + 1).join('/'))
    }
    expandKbAncestors(ancestorKeys)
  }, [pathname, expandKbAncestors])

  const renderTreeContent = (closeOnSelect: boolean) => (
    <div className="space-y-4 rounded-xl border border-border bg-card p-3.5 shadow-sm">
      <div>
        <Link
          href="/knowledge-base"
          onClick={() => {
            if (closeOnSelect) setIsMobileOpen(false)
          }}
          className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${
            pathname === '/knowledge-base' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>{t('sidebarOverview')}</span>
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {totalArticles} MDX
          </Badge>
        </Link>
      </div>

      <div className="space-y-2.5">
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
      </div>
    </div>
  )

  return (
    <aside className="w-full shrink-0 md:sticky md:top-20 md:w-72 lg:w-80">
      {/* Mobile collapsible navigation trigger — closed by default so article content starts immediately */}
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
