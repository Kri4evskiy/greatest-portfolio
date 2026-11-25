'use client'

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui'
import { ChevronRight, Folder, FolderOpen, Layers, Lock, Sparkles } from 'lucide-react'
import type { ReactElement } from 'react'
import type { KnowledgeTreeNode } from '@/entities/knowledge-content'
import { buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { Link } from '@/shared/i18n/navigation'
import { useExpandedKbFolders, useUIActions } from '@/shared/store/use-ui-store'

interface OptionalTooltipProps {
  disabled: boolean
  content: string
  children: ReactElement
}

function OptionalTooltip({ disabled, content, children }: OptionalTooltipProps) {
  if (disabled) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center" sideOffset={8}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

interface KnowledgeTreeItemProps {
  node: KnowledgeTreeNode
  depth: number
  pathname: string
  closeOnSelect: boolean
  isUnlocked: boolean
  lockedTooltip: string
  onSelectLeaf: () => void
  onRequestUnlock: (targetHref: string) => void
}

export function KnowledgeTreeItem({
  node,
  depth,
  pathname,
  closeOnSelect,
  isUnlocked,
  lockedTooltip,
  onSelectLeaf,
  onRequestUnlock,
}: KnowledgeTreeItemProps) {
  const expandedFolders = useExpandedKbFolders()
  const { toggleKbFolder: toggleFolder } = useUIActions()

  // Level 3 (or deepest leaf): Article inside a Subtopic
  if (node.type === 'article') {
    const href = buildKnowledgeBasePath(node.article.routePath)
    const isActive = pathname === href
    const isLocked = !isUnlocked && !isPublicKnowledgeBasePath(href)

    if (isLocked) {
      return (
        <OptionalTooltip disabled={closeOnSelect} content={lockedTooltip}>
          <button
            type="button"
            onClick={() => onRequestUnlock(href)}
            className="group flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground/75 transition-colors hover:bg-warning/10 hover:text-foreground"
          >
            <Lock className="h-3 w-3 shrink-0 text-warning" />
            <span className="truncate">{node.article.sidebarLabel}</span>
          </button>
        </OptionalTooltip>
      )
    }

    return (
      <OptionalTooltip disabled={closeOnSelect} content={node.article.title}>
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
      </OptionalTooltip>
    )
  }

  // Level 1 (Root Topic, e.g. React) or Level 2+ (Subtopic, e.g. React Compiler)
  const folderHref = buildKnowledgeBasePath(node.pathKey)
  const isExactFolderActive = pathname === folderHref
  const isInsideBranch = isExactFolderActive || pathname.startsWith(`${folderHref}/`)
  const isExpanded = expandedFolders[node.pathKey] ?? false
  const isThisProjectRoot = depth === 0 && node.segment === 'this-project'
  const isLockedBranch = !isUnlocked && !isPublicKnowledgeBasePath(folderHref)

  if (isLockedBranch) {
    return (
      <OptionalTooltip disabled={closeOnSelect} content={lockedTooltip}>
        <button
          type="button"
          onClick={() => onRequestUnlock(folderHref)}
          className="group flex w-full items-start justify-between gap-1.5 rounded-md px-1.5 py-1.5 text-left text-muted-foreground/75 transition-colors hover:bg-warning/10 hover:text-foreground"
        >
          <span className="flex min-w-0 flex-1 items-start gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning/80 transition-transform group-hover:scale-105 group-hover:text-warning" />
            <span
              className={`min-w-0 flex-1 wrap-break-word leading-snug ${
                depth === 0 ? 'text-[13px] font-medium tracking-tight' : 'text-xs font-medium'
              }`}
            >
              {node.label}
            </span>
          </span>
          <span className="mt-0.5 shrink-0 rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground/80">
            {node.articleCount}
          </span>
        </button>
      </OptionalTooltip>
    )
  }

  const levelIcon = isThisProjectRoot ? (
    <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
  ) : depth === 0 ? (
    <Layers className={`h-3.5 w-3.5 shrink-0 ${isInsideBranch ? 'text-primary' : 'text-muted-foreground'}`} />
  ) : isExpanded ? (
    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/80" />
  ) : (
    <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  )

  return (
    <Collapsible open={isExpanded} onOpenChange={() => toggleFolder(node.pathKey)} className="space-y-0.5">
      <div
        className={`group flex items-start justify-between gap-1 rounded-md py-0.5 pr-1.5 transition-colors ${
          isExactFolderActive
            ? 'bg-primary/10 font-semibold text-primary'
            : isInsideBranch
              ? 'bg-muted/40 text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Toggle ${node.label}`}
            className="mt-[1px] h-6 w-6 shrink-0 rounded-sm text-current hover:bg-muted"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>

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
          <span className="mt-0.5 shrink-0">{levelIcon}</span>
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

      <CollapsibleContent>
        <div className="ml-[11px] space-y-0.5 border-l border-border/70 pl-2.5 pt-0.5">
          {node.children.map((child) => (
            <KnowledgeTreeItem
              key={child.pathKey}
              node={child}
              depth={depth + 1}
              pathname={pathname}
              closeOnSelect={closeOnSelect}
              isUnlocked={isUnlocked}
              lockedTooltip={lockedTooltip}
              onSelectLeaf={onSelectLeaf}
              onRequestUnlock={onRequestUnlock}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
