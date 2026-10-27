'use client';

import { useLogoutVisitor, useVisitorProfile } from '@/hooks/use-session';
import { useUIStore } from '@/store/use-ui-store';
import { Badge, Button } from '@repo/ui';
import { BookOpen, FileText, Lock, LockOpen, LogOut, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left: Notion Workfolio Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1 font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
              W
            </span>
            <span>workfolio</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="hidden text-muted-foreground sm:inline">
            {pathname.startsWith('/knowledge-base') ? 'knowledge-base' : 'cv-overview'}
          </span>
          <Badge variant="core" className="ml-1 hidden md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Available for Senior / Full-Stack
          </Badge>
        </div>

        {/* Right: Workfolio Section Links + Protected Base of Knowledge Switch */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/#projects"
            className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            Case Studies
          </Link>
          <Link
            href="/#experience"
            className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            Experience
          </Link>
          <Link
            href="/#tech-radar"
            className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
          >
            Tech Radar (15 ADR)
          </Link>

          <Button
            type="button"
            size="sm"
            variant={isUnlocked ? 'unlocked' : 'locked'}
            onClick={handleKnowledgeBaseClick}
            className="ml-1 font-medium"
          >
            {isUnlocked ? (
              <>
                <LockOpen className="h-3.5 w-3.5 text-emerald-600" />
                <span>🔓 Base of Knowledge</span>
                <Badge variant="outline" className="ml-1 bg-background/80 text-[10px]">
                  {session?.role}
                </Badge>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>🔒 Base of Knowledge</span>
                <Sparkles className="h-3 w-3 text-amber-500" />
              </>
            )}
          </Button>

          {isUnlocked ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={`Выйти из сессии (${session?.displayName ?? 'Guest'})`}
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    if (pathname.startsWith('/knowledge-base')) {
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

          {pathname.startsWith('/knowledge-base') ? (
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
              <Link href="/">
                <FileText className="h-3.5 w-3.5" />
                CV
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleKnowledgeBaseClick}
              className="hidden lg:inline-flex"
              title="Интерактивные MDX-статьи и D3.js графы"
            >
              <BookOpen className="h-3.5 w-3.5" />
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
