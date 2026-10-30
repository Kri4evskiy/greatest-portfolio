'use client'

import { Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui'
import { Image as ImageIcon, Maximize2 } from 'lucide-react'
import { useState } from 'react'

export interface ArticleDiagramCard {
  id: string
  title: string
  caption: string
  formatLabel: string
  metricsBadge: string
  svgPreviewType: 'webp-pipeline' | 'cookie-guard' | 'redact-bundle'
}

const DEFAULT_CARDS: readonly ArticleDiagramCard[] = [
  {
    id: 'webp-ssg-grid',
    title: 'WebP Next/Image & SSG Asset Pipeline',
    caption:
      'Автоматическая конвертация растровой графики в WebP (экономия 42% веса) и адаптивная сетка с ленивой загрузкой.',
    formatLabel: 'image/webp • q=85',
    metricsBadge: '-42% Payload',
    svgPreviewType: 'webp-pipeline',
  },
  {
    id: 'edge-rbac-cookie',
    title: 'HttpOnly Cookie + Edge Verification Flow',
    caption:
      'Защита от XSS: токен kb_access_token недоступен из window.localStorage и валидируется на уровне Next.js Edge.',
    formatLabel: 'image/webp • diagram',
    metricsBadge: '0 XSS Surface',
    svgPreviewType: 'cookie-guard',
  },
]

export function ArticleImageGrid({
  items = DEFAULT_CARDS,
  columns = 2,
}: {
  items?: readonly ArticleDiagramCard[]
  columns?: 1 | 2
}) {
  const [zoomedItem, setZoomedItem] = useState<ArticleDiagramCard | null>(null)

  return (
    <div className="my-6 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-mono">
          <ImageIcon className="h-3.5 w-3.5" />
          MDX Component: &lt;ArticleImageGrid /&gt; (WebP Adaptive Grid)
        </span>
        <span className="font-mono text-[11px]">Click card to zoom</span>
      </div>

      <div className={`grid gap-4 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setZoomedItem(item)}
            className="group flex flex-col justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="w-full">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {item.formatLabel}
                </Badge>
                <Badge variant="success" className="font-mono text-[10px]">
                  {item.metricsBadge}
                </Badge>
              </div>

              <div className="my-3 flex h-28 items-center justify-center rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                <div className="text-center space-y-1">
                  <div className="font-semibold text-foreground">{item.title}</div>
                  <div className="text-[11px] text-emerald-600">[WebP Vector/Raster Asset Preview]</div>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
              <Maximize2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </div>
          </button>
        ))}
      </div>

      <Dialog
        open={zoomedItem !== null}
        onOpenChange={(open) => {
          if (!open) setZoomedItem(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {zoomedItem ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {zoomedItem.formatLabel}
                  </Badge>
                  <Badge variant="success" className="font-mono text-xs">
                    {zoomedItem.metricsBadge}
                  </Badge>
                </div>
                <DialogTitle className="mt-2">{zoomedItem.title}</DialogTitle>
                <DialogDescription>{zoomedItem.caption}</DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border bg-muted/40 p-6 text-center font-mono text-xs">
                Оптимизированный ассет <code>&lt;ArticleImageGrid /&gt;</code> • Формат <code>WebP</code> • Поддержка
                многоколоночных сеток внутри <code>.mdx</code> статей.
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
