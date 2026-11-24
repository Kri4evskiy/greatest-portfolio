'use client'

import { Button } from '@repo/ui'
import { ArrowUp, ChevronDown, ListTree } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

export interface ArticleTocItem {
  id: string
  text: string
  level: 2 | 3 | 4
}

function useActiveHeading(items: readonly ArticleTocItem[]): string {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')

  useEffect(() => {
    if (items.length === 0) return
    const firstId = items[0]?.id ?? ''
    setActiveId(firstId)

    const headingElements = items
      .map((item) => ({ id: item.id, el: document.getElementById(item.id) }))
      .filter((entry): entry is { id: string; el: HTMLElement } => entry.el !== null)

    if (headingElements.length === 0) return

    const visibleIds = new Set<string>()
    const lastTopById = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          lastTopById.set(id, entry.boundingClientRect.top)
          if (entry.isIntersecting) {
            visibleIds.add(id)
          } else {
            visibleIds.delete(id)
          }
        }

        // Prefer the first heading currently intersecting the upper reading band
        for (const item of items) {
          if (visibleIds.has(item.id)) {
            setActiveId(item.id)
            return
          }
        }

        // When reading the body between two headings, keep the last heading passed above the band
        let current = firstId
        for (const item of items) {
          const top = lastTopById.get(item.id)
          if (top !== undefined && top <= 140) {
            current = item.id
          }
        }
        setActiveId(current)
      },
      {
        rootMargin: '-88px 0px -65% 0px',
        threshold: [0, 1],
      },
    )

    for (const { el } of headingElements) {
      observer.observe(el)
    }

    return () => {
      observer.disconnect()
    }
  }, [items])

  return activeId
}

function scrollToHeadingId(id: string) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
  }
}

export function MobileArticleToc({ items }: { items: readonly ArticleTocItem[] }) {
  const t = useTranslations('KnowledgeBase')
  const [isOpen, setIsOpen] = useState(false)

  if (items.length < 2) return null

  return (
    <div className="my-4 rounded-xl border border-border bg-muted/25 xl:hidden">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-auto w-full justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-foreground hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-muted-foreground">
          <ListTree className="h-3.5 w-3.5 text-primary" />
          <span>{t('tocTitle')}</span>
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px]">{items.length}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen ? (
        <nav className="border-t border-border/60 px-3 py-2.5">
          <ul className="space-y-1">
            {items.map((item) => {
              const indentClass = item.level === 2 ? 'pl-1' : item.level === 3 ? 'pl-4' : 'pl-7'
              return (
                <li key={item.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      scrollToHeadingId(item.id)
                      setIsOpen(false)
                    }}
                    className={`h-auto w-full justify-start whitespace-normal rounded-sm px-2 py-1 text-left text-xs font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground ${indentClass}`}
                  >
                    {item.text}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}

export function DesktopArticleToc({ items }: { items: readonly ArticleTocItem[] }) {
  const t = useTranslations('KnowledgeBase')
  const tHeader = useTranslations('Header')
  const activeId = useActiveHeading(items)

  if (items.length === 0) return null

  return (
    <aside className="hidden w-56 shrink-0 xl:sticky xl:top-20 xl:block">
      <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ListTree className="h-3.5 w-3.5 text-primary" />
          <span>{t('tocTitle')}</span>
        </div>

        <nav>
          <ul className="space-y-1 border-l border-border/70">
            {items.map((item) => {
              const isActive = activeId === item.id
              const indentClass = item.level === 2 ? 'pl-3' : item.level === 3 ? 'pl-5 text-[11px]' : 'pl-7 text-[11px]'
              return (
                <li key={item.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToHeadingId(item.id)}
                    className={`-ml-px h-auto w-full justify-start whitespace-normal rounded-none border-l-2 py-1 pr-0 text-left text-xs leading-snug hover:bg-transparent ${indentClass} ${
                      isActive
                        ? 'border-primary font-semibold text-foreground'
                        : 'border-transparent font-normal text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <span className="line-clamp-2">{item.text}</span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-3 border-t border-border/60 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              window.history.replaceState(null, '', window.location.pathname + window.location.search)
            }}
            className="h-auto gap-1.5 px-1 py-0.5 font-mono text-[11px] font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <ArrowUp className="h-3 w-3" />
            <span>{tHeader('scrollToTop')}</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
