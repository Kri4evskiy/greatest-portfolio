import { Badge } from '@repo/ui'
import { FolderTree, Layers, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { KnowledgeTreeFolderNode } from '@/lib/mdx-content'

interface TopicSubtopicTabsProps {
  rootTopic: KnowledgeTreeFolderNode
  activeSubtopicSegment: string | null
  topicBadgeLabel: string
  allSubtopicsLabel: string
  compact?: boolean
}

export function TopicSubtopicTabs({
  rootTopic,
  activeSubtopicSegment,
  topicBadgeLabel,
  allSubtopicsLabel,
  compact = false,
}: TopicSubtopicTabsProps) {
  const subtopics = rootTopic.children.filter((child): child is KnowledgeTreeFolderNode => child.type === 'folder')

  if (subtopics.length === 0) {
    return null
  }

  const rootHref = `/knowledge-base/${rootTopic.pathKey}`
  const isAllActive = activeSubtopicSegment === null
  const isThisProject = rootTopic.segment === 'this-project'

  return (
    <div
      className={`rounded-xl border border-border bg-card shadow-sm ${
        compact ? 'mb-4 p-3 sm:px-4 sm:py-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
            {topicBadgeLabel}
          </Badge>
          <Link
            href={rootHref}
            className="inline-flex items-center gap-1.5 font-semibold text-foreground transition-colors hover:text-primary"
          >
            {isThisProject ? (
              <Sparkles className="h-4 w-4 text-primary" />
            ) : (
              <FolderTree className="h-4 w-4 text-primary" />
            )}
            <span className={compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}>{rootTopic.label}</span>
          </Link>
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          {subtopics.length} • {rootTopic.articleCount} MDX
        </span>
      </div>

      {/* Horizontal Subtopic Tabs (Вкладки подтем внутри выбранной Темы) */}
      <nav aria-label={`${rootTopic.label} subtopics`} className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        <Link
          href={rootHref}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isAllActive
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border/80 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span>{allSubtopicsLabel}</span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              isAllActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
            }`}
          >
            {rootTopic.articleCount}
          </span>
        </Link>

        {subtopics.map((sub) => {
          const isSubActive = activeSubtopicSegment === sub.segment
          const subHref = `/knowledge-base/${sub.pathKey}`
          return (
            <Link
              key={sub.pathKey}
              href={subHref}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isSubActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border/80 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{sub.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  isSubActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                {sub.articleCount}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
