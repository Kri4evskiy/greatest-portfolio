'use client'

import { getKnowledgeFormatLabel, type KnowledgeNoteFormat, type SupportedLocale } from '@repo/shared-schemas'
import { Button, Collapsible, CollapsibleContent, Input, ToggleGroup, ToggleGroupItem } from '@repo/ui'
import { ChevronDown, ChevronUp, Hash, RotateCcw, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

const NOTE_FORMATS: readonly KnowledgeNoteFormat[] = ['cheat-sheet', 'deep-dive', 'adr']
const MAX_VISIBLE_TAGS = 10

interface TagFilterPillProps {
  tag: string
  count: number
  active: boolean
  onToggle: (tag: string) => void
}

function TagFilterPill({ tag, count, active, onToggle }: TagFilterPillProps) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-pressed={active}
      onClick={() => onToggle(tag)}
      className={`h-auto gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-normal ${
        active
          ? ''
          : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      <span>#{tag}</span>
      <span className="opacity-70">({count})</span>
    </Button>
  )
}

interface DirectoryFilterBarProps {
  locale: SupportedLocale
  tags: ReadonlyArray<{ tag: string; count: number }>
  selectedFormat: KnowledgeNoteFormat | 'ALL'
  selectedTag: string | null
  isFiltering: boolean
  onSelectFormat: (format: KnowledgeNoteFormat | 'ALL') => void
  onToggleTag: (tag: string) => void
  onClearFilters: () => void
  onOpenSearch: () => void
}

export function DirectoryFilterBar({
  locale,
  tags,
  selectedFormat,
  selectedTag,
  isFiltering,
  onSelectFormat,
  onToggleTag,
  onClearFilters,
  onOpenSearch,
}: DirectoryFilterBarProps) {
  const t = useTranslations('KnowledgeBase')
  const [showAllTags, setShowAllTags] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')

  const hiddenTagsCount = Math.max(0, tags.length - MAX_VISIBLE_TAGS)

  const collapsedTags = useMemo(() => {
    const topTags = tags.slice(0, MAX_VISIBLE_TAGS)
    if (!selectedTag || topTags.some((item) => item.tag === selectedTag)) {
      return topTags
    }
    const activeRareTag = tags.find((item) => item.tag === selectedTag)
    return activeRareTag ? [...topTags, activeRareTag] : topTags
  }, [tags, selectedTag])

  const filteredAllTags = useMemo(() => {
    const normalizedQuery = tagSearchQuery.trim().replace(/^#+/, '').toLowerCase()
    if (!normalizedQuery) return tags
    return tags.filter((item) => item.tag.toLowerCase().includes(normalizedQuery))
  }, [tags, tagSearchQuery])

  const toggleShowAllTags = () => {
    setShowAllTags((prev) => {
      if (prev) setTagSearchQuery('')
      return !prev
    })
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={selectedFormat}
          aria-label={t('filterFormatAll')}
          onValueChange={(nextValue) => {
            if (!nextValue || nextValue === 'ALL') {
              onSelectFormat('ALL')
              return
            }
            const matched = NOTE_FORMATS.find((fmt) => fmt === nextValue)
            if (matched) onSelectFormat(matched)
          }}
          className="flex flex-wrap items-center gap-1.5"
        >
          <ToggleGroupItem
            value="ALL"
            className="h-auto rounded-lg bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {t('filterFormatAll')}
          </ToggleGroupItem>
          {NOTE_FORMATS.map((fmt) => (
            <ToggleGroupItem
              key={fmt}
              value={fmt}
              className="h-auto rounded-lg bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {getKnowledgeFormatLabel(fmt, locale)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          className="h-auto justify-between gap-3 rounded-lg bg-muted/30 px-3 py-1.5 text-xs font-normal text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-primary" />
            <span>{t('sidebarSearchTrigger')}</span>
          </span>
          <kbd className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </Button>
      </div>

      {tags.length > 0 ? (
        <div className="space-y-2.5 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>{t('filterTagsLabel')}</span>
            </span>

            {!showAllTags
              ? collapsedTags.map(({ tag, count }) => (
                  <TagFilterPill
                    key={tag}
                    tag={tag}
                    count={count}
                    active={selectedTag === tag}
                    onToggle={onToggleTag}
                  />
                ))
              : null}

            {hiddenTagsCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={showAllTags}
                onClick={toggleShowAllTags}
                className="h-auto gap-1 rounded-md border-dashed border-primary/40 bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-medium text-primary hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                {showAllTags ? (
                  <>
                    <span>{t('hideAllTags')}</span>
                    <ChevronUp className="h-3 w-3 text-primary" />
                  </>
                ) : (
                  <>
                    <span>{t('showAllTags', { count: hiddenTagsCount })}</span>
                    <ChevronDown className="h-3 w-3 text-primary" />
                  </>
                )}
              </Button>
            ) : null}

            {isFiltering ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="ml-auto h-auto gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-normal text-primary hover:bg-transparent hover:text-primary hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{t('clearFilters')}</span>
              </Button>
            ) : null}
          </div>

          <Collapsible open={showAllTags && hiddenTagsCount > 0}>
            <CollapsibleContent>
              <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder={t('searchTagsPlaceholder')}
                    aria-label={t('searchTagsPlaceholder')}
                    className="h-8 pl-8 pr-8 font-mono text-base sm:text-xs"
                  />
                  {tagSearchQuery.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('clearFilters')}
                      onClick={() => setTagSearchQuery('')}
                      className="absolute right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>

                <div className="max-h-48 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
                  {filteredAllTags.length === 0 ? (
                    <p className="py-2 text-center font-mono text-xs text-muted-foreground">{t('noMatchingTags')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {filteredAllTags.map(({ tag, count }) => (
                        <TagFilterPill
                          key={tag}
                          tag={tag}
                          count={count}
                          active={selectedTag === tag}
                          onToggle={onToggleTag}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : null}
    </div>
  )
}
