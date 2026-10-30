'use client';

import { APP_VERSION, type TelemetryEvent, TelemetryEventSchema } from '@repo/shared-schemas';
import { Badge } from '@repo/ui';
import { Activity, Database, Radio, Server } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WorkfolioFooter() {
  const [sseConnected, setSseConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<TelemetryEvent | null>(null);

  useEffect(() => {
    let source: EventSource | null = null;
    try {
      source = new EventSource('/api/telemetry/stream', {
        withCredentials: true,
      });

      source.onopen = () => {
        setSseConnected(true);
      };

      source.onmessage = (event) => {
        try {
          const parsedJson: unknown = JSON.parse(event.data as string);
          const validated = TelemetryEventSchema.safeParse(parsedJson);
          if (validated.success) {
            setLatestEvent(validated.data);
            setSseConnected(true);
          }
        } catch {
          // Ignore malformed event
        }
      };

      source.onerror = () => {
        setSseConnected(false);
      };
    } catch {
      setSseConnected(false);
    }

    return () => {
      source?.close();
    };
  }, []);

  return (
    <footer className="mt-20 border-t border-border/70 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              greatest-portfolio
            </span>
            <Badge variant="outline" className="font-mono text-[11px]">
              v{APP_VERSION} (Lefthook Auto-Bump)
            </Badge>
            <Badge variant="secondary" className="font-mono text-[11px]">
              <Database className="mr-1 h-3 w-3" />
              IndexedDB Offline-First
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Monorepo: Next.js 16 (App Router) • NestJS 12 (Native ESM) • Prisma (Neon PostgreSQL) •
            Microservices TCP &amp; SSE
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-background px-3.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Radio className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[11px] font-medium">
              {sseConnected ? 'SSE LIVE' : 'SSE STANDBY'}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-xs sm:max-w-md truncate">
            {latestEvent ? (
              <>
                <Activity className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate font-mono text-[11px]" title={latestEvent.message}>
                  {latestEvent.message}
                </span>
              </>
            ) : (
              <>
                <Server className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-[11px]">
                  /api/telemetry/stream • Waiting for pulse...
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
