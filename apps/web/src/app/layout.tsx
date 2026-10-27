import { LiveSseFooter } from '@/components/layout/live-sse-footer';
import { WorkfolioHeader } from '@/components/layout/workfolio-header';
import { GuestPassModal } from '@/features/auth/guest-pass-modal';
import { ObservabilityProvider } from '@/providers/observability-provider';
import { QueryProvider } from '@/providers/query-provider';
import type { Metadata } from 'next';
import * as React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title:
    'Stanislav Krychevskyi | Senior Frontend & Fullstack Engineer — Workfolio & Knowledge Base',
  description:
    'Stanislav Krychevskyi — Frontend / Fullstack Engineer (5+ years, React, Next.js, NestJS, TypeScript, D3.js, AI DX). Production Workfolio & Protected Engineering Knowledge Base.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <QueryProvider>
          <ObservabilityProvider>
            <React.Suspense
              fallback={<div className="h-14 border-b border-border/80 bg-background" />}
            >
              <WorkfolioHeader />
            </React.Suspense>
            <main className="flex-1">{children}</main>
            <GuestPassModal />
            <LiveSseFooter />
          </ObservabilityProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
