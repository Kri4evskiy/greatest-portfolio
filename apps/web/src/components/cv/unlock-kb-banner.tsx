'use client';

import { useVisitorProfile } from '@/hooks/use-session';
import { useUIStore } from '@/store/use-ui-store';
import { Badge, Button } from '@repo/ui';
import { ArrowRight, Compass, Lock, LockOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type * as React from 'react';

export function UnlockKbBanner(): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useVisitorProfile();
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal);

  const isUnlocked = session?.role === 'USER' || session?.role === 'ADMIN';

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-border/80 bg-muted/40 p-5 sm:flex-row sm:items-center">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Compass className="h-4 w-4 text-emerald-600" />
            Interactive Engineering Knowledge Base
          </span>
          <Badge variant={isUnlocked ? 'core' : 'warning'} className="text-[11px]">
            {isUnlocked ? `Unlocked (${session?.role})` : 'Protected • Edge Middleware + JWT'}
          </Badge>
        </div>
        <p className="max-w-xl text-xs text-muted-foreground leading-relaxed">
          {isUnlocked
            ? `Доступ открыт для ${session?.displayName ?? 'Вас'}. Внутри — интерактивные графы D3.js (React 18 vs 19), каталог 15 ADR и кэш IndexedDB (24h TTL).`
            : 'Раздел /knowledge-base защищен через Next.js Edge Middleware и NestJS HttpOnly Cookies. Разблокируйте доступ в 1 клик без паролей (живое демо RHF + Zod + RBAC + SSE).'}
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        variant={isUnlocked ? 'unlocked' : 'default'}
        onClick={() => {
          if (isUnlocked) {
            router.push('/knowledge-base');
          } else {
            openGuestPassModal('/knowledge-base');
          }
        }}
        className="shrink-0 gap-1.5"
      >
        {isUnlocked ? (
          <>
            <LockOpen className="h-3.5 w-3.5" />
            <span>Open Knowledge Base</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            <span>Unlock in 1 Click</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
    </div>
  );
}
