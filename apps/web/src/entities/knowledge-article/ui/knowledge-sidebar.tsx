'use client'

import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
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
  Search,
  Sparkles,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import type { KnowledgeTreeFolderNode, KnowledgeTreeNode } from '@/entities/knowledge-content'
import { prefetchKnowledgeSearchIndex } from '@/features/search/search-index-client'
import { APP_ROUTES, isRouteActive } from '@/shared/i18n/app-routes'
import { Link, usePathname } from '@/shared/i18n/navigation'
import { useExpandedKbFolders, useUIActions } from '@/shared/store/use-ui-store'

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
  const expandedFolders = useExpandedKbFolders()
  const { toggleKbFolder: toggleFolder } = useUIActions()

  // Level 3 (or deepest leaf): Article inside a Subtopic
  if (node.type === 'article') {
    const href = `/knowledge-base/${node.article.routePath}`
    const isActive = pathname === href
    const linkElement = (
      <Link
        href={href}
        prefetch={false}
        onClick={() => {
          if (closeOnSelect) onSelectLeaf()
        }}
        className={`group flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
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

    if (closeOnSelect) {
      return linkElement
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={8}>
          {node.article.title}
        </TooltipContent>
      </Tooltip>
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
        className={`group flex items-start justify-between gap-1 rounded-md py-0.5 pr-1.5 transition-colors ${
          isExactFolderActive
            ? 'bg-primary/10 font-semibold text-primary'
            : isInsideBranch
              ? 'bg-muted/40 text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        {/* Arrow button: expands/collapses the tree branch in-place */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-expanded={isExpanded}
          aria-label={`Toggle ${node.label}`}
          onClick={() => toggleFolder(node.pathKey)}
          className="mt-[1px] h-6 w-6 shrink-0 rounded-sm text-current hover:bg-muted"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </Button>

        {/* Clicking the Topic or Subtopic name BOTH expands the branch AND opens its Topic/Subtopic hub with tabs */}
        <Link
          href={folderHref}
          prefetch={false}
          onClick={() => {
            if (!isExpanded || isExactFolderActive) {
              toggleFolder(node.pathKey)
            }
            if (closeOnSelect) onSelectLeaf()
          }}
          className="flex min-w-0 flex-1 items-start gap-1.5 py-1 text-left"
        >
          <span className="mt-0.5 shrink-0">{renderLevelIcon()}</span>
          <span
            className={`min-w-0 flex-1 wrap-break-word leading-snug ${
              depth === 0 ? 'text-[13px] font-semibold tracking-tight text-foreground' : 'text-xs font-medium'
            }`}
          >
            {node.label}
          </span>
        </Link>

        <span className="mt-1 shrink-0 rounded-sm bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground">
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
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale = parsedLocale.success ? parsedLocale.data : DEFAULT_LOCALE
  const pathname = usePathname()
  const expandedFolders = useExpandedKbFolders()
  const {
    hydrateKbFoldersFromSession,
    expandKbAncestors,
    collapseAllKbFolders,
    expandAllKbFolders,
    openCommandPalette,
  } = useUIActions()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const allFolderKeys = useMemo(() => collectAllFolderKeys(tree), [tree])
  const hasAnyExpanded = useMemo(
    () => allFolderKeys.some((key) => Boolean(expandedFolders[key])),
    [allFolderKeys, expandedFolders],
  )

  useEffect(() => {
    hydrateKbFoldersFromSession()
  }, [hydrateKbFoldersFromSession])

  // Automatically expand only the active ancestor chain when opening a Topic, Subtopic, or Article
  useEffect(() => {
    const kbPrefix = `${APP_ROUTES.knowledgeBase}/`
    if (!pathname.startsWith(kbPrefix)) return
    const rel = pathname.slice(kbPrefix.length)
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

  const toggleAllLabel = hasAnyExpanded ? t('collapseAllTree') : t('expandAllTree')

  const renderTreeContent = (closeOnSelect: boolean) => {
    const toggleAllButton = (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={toggleAllLabel}
        onClick={() => {
          if (hasAnyExpanded) {
            collapseAllKbFolders()
          } else {
            expandAllKbFolders(allFolderKeys)
          }
        }}
        className="h-7 w-7 shrink-0 border-border/60 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {hasAnyExpanded ? <ChevronsDownUp className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
      </Button>
    )

    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseEnter={() => prefetchKnowledgeSearchIndex(locale)}
          onFocus={() => prefetchKnowledgeSearchIndex(locale)}
          onClick={() => {
            if (closeOnSelect) setIsMobileOpen(false)
            openCommandPalette('')
          }}
          className="h-auto w-full justify-between gap-2 rounded-lg border-border/80 bg-muted/30 px-2.5 py-1.5 text-left text-xs font-normal text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{t('sidebarSearchTrigger')}</span>
          </span>
          <kbd className="shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>

        <div className="flex items-center gap-1 border-b border-border/60 pb-2.5">
          <Link
            href={APP_ROUTES.knowledgeBase}
            onClick={() => {
              if (closeOnSelect) setIsMobileOpen(false)
            }}
            className={`flex min-w-0 flex-1 items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isRouteActive(pathname, APP_ROUTES.knowledgeBase)
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t('sidebarOverview')}</span>
            </span>
            <span
              className={`ml-2 shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${
                isRouteActive(pathname, APP_ROUTES.knowledgeBase)
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {totalArticles}
            </span>
          </Link>

          {closeOnSelect ? (
            toggleAllButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>{toggleAllButton}</TooltipTrigger>
              <TooltipContent side="right">{toggleAllLabel}</TooltipContent>
            </Tooltip>
          )}
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
  }

  return (
    <aside className="w-full shrink-0 md:sticky md:top-20 md:w-64 lg:w-72">
      {/* Mobile collapsible navigation trigger — closed by default so content starts immediately */}
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="h-auto w-full justify-between rounded-xl border-border bg-card px-3.5 py-2.5 text-left text-xs font-medium text-foreground shadow-xs hover:bg-accent/50"
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
        </Button>

        {isMobileOpen ? <div className="mt-2">{renderTreeContent(true)}</div> : null}
      </div>

      {/* Desktop sticky sidebar rail (>= md) */}
      <div className="hidden max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain md:block">
        {renderTreeContent(false)}
      </div>
    </aside>
  )
}
