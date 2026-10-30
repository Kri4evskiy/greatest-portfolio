import '@repo/ui/globals.css';
import { WorkfolioFooter } from '@/components/layout/workfolio-footer';
import { WorkfolioHeader } from '@/components/layout/workfolio-header';
import { GuestPassModal } from '@/features/auth/guest-pass-modal';
import { QueryProvider } from '@/providers/query-provider';
import type { Metadata } from 'next';
import { type ReactNode, Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Senior Full-Stack Portfolio (Workfolio UI) & Engineering Knowledge Base',
  description:
    'Interactive Senior Full-Stack TypeScript Portfolio built with Next.js 16, NestJS 12 (Native ESM), Prisma ORM, TanStack Query IndexedDB, D3.js, and Microservices SSE.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <QueryProvider>
          <div className="flex min-h-screen flex-col">
            <WorkfolioHeader />
            <Suspense fallback={null}>
              <GuestPassModal />
            </Suspense>
            <main className="flex-1">{children}</main>
            <WorkfolioFooter />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
