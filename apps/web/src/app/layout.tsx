import { LiveSseFooter } from '@/components/layout/live-sse-footer';
import { WorkfolioHeader } from '@/components/layout/workfolio-header';
import { GuestPassModal } from '@/features/auth/guest-pass-modal';
import { QueryProvider } from '@/providers/query-provider';
import type { Metadata } from 'next';
import * as React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workfolio & Engineering Knowledge Base | Senior Full-Stack Architect',
  description:
    'Production Full-Stack Portfolio & Protected Engineering Knowledge Base built with Next.js App Router, NestJS, Prisma, Microservices SSE, and IndexedDB Offline-First cache.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <QueryProvider>
          <React.Suspense
            fallback={<div className="h-14 border-b border-border/80 bg-background" />}
          >
            <WorkfolioHeader />
          </React.Suspense>
          <main className="flex-1">{children}</main>
          <GuestPassModal />
          <LiveSseFooter />
        </QueryProvider>
      </body>
    </html>
  );
}
