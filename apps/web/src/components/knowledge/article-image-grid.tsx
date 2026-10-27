'use client';

import { Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';
import { Maximize2 } from 'lucide-react';
import * as React from 'react';

export interface ArticleImageItem {
  title: string;
  caption: string;
  aspect?: '16:9' | '4:3';
  diagramCode: string;
}

export function ArticleImageGrid({
  images,
  columns = 2,
}: {
  images: readonly ArticleImageItem[];
  columns?: 1 | 2 | 3;
}): React.JSX.Element {
  const [selected, setSelected] = React.useState<ArticleImageItem | null>(null);

  const gridClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="my-6 space-y-2">
      <div className={`grid gap-4 ${gridClass}`}>
        {images.map((img) => (
          <button
            key={img.title}
            type="button"
            onClick={() => setSelected(img)}
            className="group flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-all hover:border-primary/50"
          >
            <div className="relative flex min-h-[140px] w-full flex-col justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 p-4 font-mono text-xs text-emerald-300">
              <div className="mb-2 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-[10px] text-emerald-200"
                >
                  WebP / SVG Asset
                </Badge>
                <Maximize2 className="h-3.5 w-3.5 text-stone-400 transition-transform group-hover:scale-110 group-hover:text-white" />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed text-stone-100">
                {img.diagramCode}
              </pre>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-foreground">{img.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{img.caption}</p>
            </div>
          </button>
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="rounded-lg bg-stone-900 p-5 font-mono text-xs text-emerald-300">
                <pre className="whitespace-pre-wrap leading-relaxed">{selected.diagramCode}</pre>
              </div>
              <p className="text-xs text-muted-foreground">{selected.caption}</p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
