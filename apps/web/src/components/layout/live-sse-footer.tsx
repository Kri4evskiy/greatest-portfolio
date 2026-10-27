'use client';

import { APP_VERSION, type TelemetryEvent } from '@repo/shared-schemas';
import { Badge } from '@repo/ui';
import { Activity, Cpu, Database, Radio } from 'lucide-react';
import * as React from 'react';

export function LiveSseFooter(): React.JSX.Element {
  const [connected, setConnected] = React.useState(false);
  const [latestEvent, setLatestEvent] = React.useState<TelemetryEvent | null>(null);

  React.useEffect(() => {
    let source: EventSource | null = null;

    try {
      source = new EventSource('/api/telemetry/stream');

      source.onopen = () => {
        setConnected(true);
      };

      const handleTelemetryMessage = (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as TelemetryEvent;
          setLatestEvent(parsed);
          setConnected(true);
        } catch {
          // Ignore malformed event
        }
      };

      source.addEventListener('telemetry', handleTelemetryMessage);
      source.onmessage = handleTelemetryMessage;

      source.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
    }

    return () => {
      source?.close();
    };
  }, []);

  return (
    <footer className="mt-20 border-t border-border/80 bg-muted/40">
      <div className="mx-auto flex max-w-4xl flex-col justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="font-mono">
            <Cpu className="h-3 w-3" />
            build v{APP_VERSION}
          </Badge>
          <Badge variant="outline" className="font-mono">
            <Database className="h-3 w-3" />
            IndexedDB Cache: 24h TTL
          </Badge>
          <span>pnpm + Turborepo • Next.js App Router • NestJS • Prisma</span>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <Radio className="h-3.5 w-3.5 text-foreground" />
          <span className="font-medium text-foreground">
            {connected ? 'SSE Live:' : 'SSE Standby:'}
          </span>
          <span className="max-w-xs truncate font-mono text-[11px]">
            {latestEvent
              ? latestEvent.message
              : `Listening /api/telemetry/stream (v${APP_VERSION})`}
          </span>
          <Activity className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </footer>
  );
}
