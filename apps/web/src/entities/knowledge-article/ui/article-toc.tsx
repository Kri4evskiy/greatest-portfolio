'use client'

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
    setActiveId(items[0]?.id ?? '')

    let rafId = 0

    const updateActive = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollY + viewportHeight >= docHeight - 40) {
        const last = items[items.length - 1]
        if (last) setActiveId(last.id)
        return
      }

      let current = items[0]?.id ?? ''
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 140) {
          current = item.id
        }
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        updateActive()
      })
    }

    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
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
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium text-foreground"
      >
        <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-muted-foreground">
          <ListTree className="h-3.5 w-3.5 text-primary" />
          <span>{t('tocTitle')}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{items.length}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <nav className="border-t border-border/60 px-3 py-2.5">
          <ul className="space-y-1">
            {items.map((item) => {
              const indentClass = item.level === 2 ? 'pl-1' : item.level === 3 ? 'pl-4' : 'pl-7'
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      scrollToHeadingId(item.id)
                      setIsOpen(false)
                    }}
                    className={`block w-full rounded py-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground ${indentClass}`}
                  >
                    {item.text}
                  </button>
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
      <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl border border-border bg-card p-3.5 shadow-sm">
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
                  <button
                    type="button"
                    onClick={() => scrollToHeadingId(item.id)}
                    className={`-ml-px block w-full border-l-2 py-1 text-left text-xs leading-snug transition-colors ${indentClass} ${
                      isActive
                        ? 'border-primary font-semibold text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <span className="line-clamp-2">{item.text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-3 border-t border-border/60 pt-2">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              window.history.replaceState(null, '', window.location.pathname + window.location.search)
            }}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowUp className="h-3 w-3" />
            <span>{tHeader('scrollToTop')}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
