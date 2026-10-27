'use client';

import { useLogoutVisitor, useVisitorProfile } from '@/hooks/use-session';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@repo/ui';
import { Lock, LockOpen, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

export function WorkfolioHeader(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useVisitorProfile();
  const logoutMutation = useLogoutVisitor();
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal);

  const isUnlocked = session?.role === 'USER' || session?.role === 'ADMIN';
  const isKnowledgeBase = pathname.startsWith('/knowledge-base');

  React.useEffect(() => {
    const shouldUnlock = searchParams.get('unlock') === 'knowledge-base';
    const redirectTarget = searchParams.get('redirect') ?? '/knowledge-base';
    if (shouldUnlock && !isUnlocked) {
      openGuestPassModal(redirectTarget);
    }
  }, [searchParams, isUnlocked, openGuestPassModal]);

  const handleKnowledgeBaseClick = (): void => {
    if (isUnlocked) {
      router.push('/knowledge-base');
      return;
    }
    openGuestPassModal('/knowledge-base');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Clean Notion Breadcrumb (no wrapping, no duplicate badges) */}
        <div className="flex items-center gap-2 whitespace-nowrap text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-1.5 py-1 font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
              SK
            </span>
            <span>Stanislav Krychevskyi</span>
          </Link>
          {isKnowledgeBase ? (
            <>
              <span className="text-muted-foreground/60">/</span>
              <span className="font-mono text-xs text-muted-foreground">knowledge-base</span>
            </>
          ) : null}
        </div>

        {/* Right: Minimal Navigation + Single Clean Base of Knowledge Button */}
        <nav className="flex items-center gap-1 whitespace-nowrap">
          {!isKnowledgeBase ? (
            <div className="mr-2 hidden items-center gap-1 md:flex">
              <Link
                href="/#projects"
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Projects
              </Link>
              <Link
                href="/#experience"
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Experience
              </Link>
              <Link
                href="/#skills"
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Skills
              </Link>
              <Link
                href="/#tech-radar"
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                ADR Stack
              </Link>
            </div>
          ) : (
            <Link
              href="/"
              className="mr-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              ← Back to CV
            </Link>
          )}

          <Button
            type="button"
            size="sm"
            variant={isUnlocked ? 'unlocked' : 'locked'}
            onClick={handleKnowledgeBaseClick}
            className="h-8 gap-1.5 px-3 text-xs font-medium"
          >
            {isUnlocked ? (
              <>
                <LockOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>Base of Knowledge</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Base of Knowledge</span>
              </>
            )}
          </Button>

          {isUnlocked ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={`Sign out (${session?.displayName ?? 'Guest'})`}
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    if (isKnowledgeBase) {
                      router.push('/');
                    }
                  },
                });
              }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
