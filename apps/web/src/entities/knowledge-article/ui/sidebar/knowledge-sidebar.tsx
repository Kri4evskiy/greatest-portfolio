'use client'

import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui'
import { ChevronDown, PanelLeft } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import type { KnowledgeTreeFolderNode } from '@/entities/knowledge-content'
import { useCachedAuth } from '@/shared/hooks/use-cached-auth'
import { usePathname } from '@/shared/i18n/navigation'
import { useUIActions } from '@/shared/store/use-ui-store'
import { KnowledgeSidebarPanel } from './knowledge-sidebar-panel'
import { useKbSidebarTree } from './use-kb-sidebar-tree'

export function KnowledgeSidebar({
  tree,
  totalArticles,
}: {
  tree: readonly KnowledgeTreeFolderNode[]
  totalArticles: number
}) {
  const t = useTranslations('KnowledgeBase')
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale = parsedLocale.success ? parsedLocale.data : DEFAULT_LOCALE
  const pathname = usePathname()
  const { openCommandPalette, openGuestPassModal } = useUIActions()
  const { isUnlocked } = useCachedAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const { publicRoots, protectedRoots, hasAnyExpanded, toggleAllFolders } = useKbSidebarTree(tree, pathname, isUnlocked)

  return (
    <aside className="w-full shrink-0 md:sticky md:top-20 md:w-64 lg:w-72">
      {/* Mobile collapsible navigation drawer — closed by default so content starts immediately */}
      <Collapsible open={isMobileOpen} onOpenChange={setIsMobileOpen} className="md:hidden">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-between rounded-xl border-border bg-card px-3.5 py-2.5 text-left text-xs font-medium text-foreground shadow-xs hover:bg-accent/50"
          >
            <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-muted-foreground">
              <PanelLeft className="h-3.5 w-3.5 text-primary" />
              <span>{t('sidebarNavTitle')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {totalArticles} MDX
              </Badge>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
                  isMobileOpen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <KnowledgeSidebarPanel
            locale={locale}
            pathname={pathname}
            totalArticles={totalArticles}
            publicRoots={publicRoots}
            protectedRoots={protectedRoots}
            isUnlocked={isUnlocked}
            hasAnyExpanded={hasAnyExpanded}
            closeOnSelect={true}
            onToggleAll={toggleAllFolders}
            onOpenSearch={() => {
              setIsMobileOpen(false)
              openCommandPalette('')
            }}
            onSelectLeaf={() => setIsMobileOpen(false)}
            onRequestUnlock={(href) => {
              setIsMobileOpen(false)
              openGuestPassModal(href)
            }}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop sticky sidebar rail (>= md) with internal scrollable nav & stable scrollbar gutter */}
      <div className="hidden md:block">
        <KnowledgeSidebarPanel
          locale={locale}
          pathname={pathname}
          totalArticles={totalArticles}
          publicRoots={publicRoots}
          protectedRoots={protectedRoots}
          isUnlocked={isUnlocked}
          hasAnyExpanded={hasAnyExpanded}
          closeOnSelect={false}
          scrollable={true}
          onToggleAll={toggleAllFolders}
          onOpenSearch={() => openCommandPalette('')}
          onSelectLeaf={() => setIsMobileOpen(false)}
          onRequestUnlock={openGuestPassModal}
        />
      </div>
    </aside>
  )
}
