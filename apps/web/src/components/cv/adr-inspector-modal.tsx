'use client';

import { useUIStore } from '@/store/use-ui-store';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { CheckCircle2, Code2, Compass, HelpCircle, MapPin } from 'lucide-react';
import type * as React from 'react';

export function AdrInspectorModal(): React.JSX.Element {
  const item = useUIStore((s) => s.selectedAdrItem);
  const closeInspector = useUIStore((s) => s.closeAdrInspector);

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) closeInspector();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        {item ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="core">ADR #{item.adrNumber} of 15</Badge>
                <Badge variant="secondary">{item.category}</Badge>
                <Badge variant="outline">{item.experienceYears}+ yrs experience</Badge>
              </div>
              <DialogTitle className="mt-2 text-xl">{item.name}</DialogTitle>
              <DialogDescription>{item.summary}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span>Почему выбрали (Why)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.adrWhy}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>Где применяется в проекте (Where)</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  {item.adrWhere}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                  <span>Как реализовано (How)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.adrHow}</p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Зафиксировано в .agents/architecture/adr-stack.md
              </span>
              <Button type="button" onClick={closeInspector}>
                <Compass className="h-4 w-4" />
                Понятно
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
