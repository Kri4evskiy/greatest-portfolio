'use client';

import { useVisitorProfile } from '@/hooks/use-session';
import { useUIStore } from '@/store/use-ui-store';
import { Badge, Button } from '@repo/ui';
import { ArrowRight, Lock, LockOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type * as React from 'react';

export function UnlockKbBanner(): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useVisitorProfile();
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal);

  const isUnlocked = session?.role === 'USER' || session?.role === 'ADMIN';

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={isUnlocked ? 'core' : 'warning'}>
            {isUnlocked ? `Unlocked (${session?.role})` : 'Protected Route • Edge Middleware'}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">/knowledge-base/*</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Инженерная База Знаний (MDX + D3.js + Offline-First IndexedDB)
        </h3>
        <p className="max-w-xl text-sm text-muted-foreground">
          {isUnlocked
            ? `Доступ открыт для ${session?.displayName ?? 'Вас'}. Внутри — интерактивные графы D3.js, разбор React 18 vs 19, каталог 15 ADR и эксперимент TanStack Redact.`
            : 'Разблокируйте доступ в 1 клик без паролей — протестируйте связку React Hook Form + Zod + NestJS JWT HttpOnly Cookies + RBAC.'}
        </p>
      </div>

      <Button
        type="button"
        variant={isUnlocked ? 'unlocked' : 'default'}
        onClick={() => {
          if (isUnlocked) {
            router.push('/knowledge-base');
          } else {
            openGuestPassModal('/knowledge-base');
          }
        }}
        className="shrink-0 gap-2"
      >
        {isUnlocked ? (
          <>
            <LockOpen className="h-4 w-4" />
            Перейти в Base of Knowledge
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Разблокировать в 1 клик
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
