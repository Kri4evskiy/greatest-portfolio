'use client'

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui'
import { Download, ExternalLink, FileText, LayoutList } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ReactNode, useState } from 'react'
import { trackEvent } from '@/shared/lib/analytics'
import type { CvFileMetadata } from './cv-file'

type CvViewMode = 'pdf' | 'structured'

export function CvDownloadActions({ cvMeta }: { cvMeta: CvFileMetadata }) {
  const t = useTranslations('CvPage')

  const handleDownloadClick = (source: string) => {
    trackEvent('cv_pdf_downloaded', {
      source,
      fileName: cvMeta.fileName,
    })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <a
        href={cvMeta.publicUrl}
        download={cvMeta.downloadFileName}
        onClick={() => handleDownloadClick('cv_page_primary_btn')}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{t('downloadPdfBtn')}</span>
      </a>

      <a
        href={cvMeta.publicUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => handleDownloadClick('cv_page_open_new_tab')}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent sm:text-sm"
      >
        <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
        <span>{t('openFullscreenBtn')}</span>
      </a>
    </div>
  )
}

interface CvViewTabsProps {
  cvMeta: CvFileMetadata
  structuredSlot: ReactNode
}

/**
 * Lightweight Client Island for switching between embedded PDF preview and the
 * Server-rendered ATS resume (`structuredSlot`). Uses `forceMount` + CSS hiding
 * so search crawlers always receive the full structured resume HTML on SSR while
 * keeping `author-profile.ts` (trilingual data) completely out of client JS.
 */
export function CvViewTabs({ cvMeta, structuredSlot }: CvViewTabsProps) {
  const t = useTranslations('CvPage')
  const [viewMode, setViewMode] = useState<CvViewMode>('pdf')

  const handleDownloadClick = (source: string) => {
    trackEvent('cv_pdf_downloaded', {
      source,
      fileName: cvMeta.fileName,
    })
  }

  return (
    <Tabs
      value={viewMode}
      onValueChange={(nextValue) => {
        if (nextValue === 'pdf' || nextValue === 'structured') {
          setViewMode(nextValue)
        }
      }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList className="h-auto rounded-xl border-border bg-muted/40 p-1">
          <TabsTrigger value="pdf" className="gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>{t('tabPdfPreview')}</span>
          </TabsTrigger>

          <TabsTrigger value="structured" className="gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm">
            <LayoutList className="h-3.5 w-3.5 text-primary" />
            <span>{t('tabStructuredCv')}</span>
          </TabsTrigger>
        </TabsList>

        <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">{t('mobileViewerHint')}</span>
      </div>

      <TabsContent value="pdf" className="mt-0 space-y-4">
        {/* Mobile Helper Banner (< md): Native Fullscreen / Download for Multi-Page PDFs */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs md:hidden">
          <p className="leading-relaxed text-foreground/90">{t('mobilePdfBanner')}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={cvMeta.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-mono text-xs font-medium text-primary-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{t('openFullscreenBtn')}</span>
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewMode('structured')}
              className="h-auto gap-1.5 px-3 py-1.5 font-mono text-xs"
            >
              <LayoutList className="h-3.5 w-3.5 text-primary" />
              <span>{t('tabStructuredCv')}</span>
            </Button>
          </div>
        </div>

        {/* Embedded PDF Frame */}
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-md">
          <object
            data={`${cvMeta.publicUrl}#view=FitH`}
            type="application/pdf"
            aria-label="Stanislav Krychevskyi CV PDF"
            className="h-[72dvh] min-h-130 w-full md:h-[84dvh] md:min-h-190"
          >
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <FileText className="h-10 w-10 text-primary" />
              <p className="max-w-md text-sm text-muted-foreground">{t('pdfFallbackText')}</p>
              <a
                href={cvMeta.publicUrl}
                download={cvMeta.downloadFileName}
                onClick={() => handleDownloadClick('cv_object_fallback')}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                <span>{t('downloadPdfBtn')}</span>
              </a>
            </div>
          </object>
        </div>
      </TabsContent>

      <TabsContent value="structured" forceMount className="mt-0 data-[state=inactive]:hidden">
        {structuredSlot}
      </TabsContent>
    </Tabs>
  )
}
