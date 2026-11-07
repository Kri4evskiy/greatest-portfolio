'use client'

import type { SupportedLocale } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import {
  ArrowLeft,
  Award,
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Languages,
  LayoutList,
  Linkedin,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { AUTHOR_PROFILE, AUTHOR_SKILL_GROUPS, COMMERCIAL_EXPERIENCE, pickLocalized } from '@/data/author-profile'
import { Link } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import type { CvFileMetadata } from '@/lib/cv-file'

interface CvDocumentShowcaseProps {
  cvMeta: CvFileMetadata
  locale: SupportedLocale
}

type CvViewMode = 'pdf' | 'structured'

export function CvDocumentShowcase({ cvMeta, locale }: CvDocumentShowcaseProps) {
  const t = useTranslations('CvPage')
  const tHero = useTranslations('Hero')
  const [viewMode, setViewMode] = useState<CvViewMode>('pdf')

  const handleDownloadClick = (source: string) => {
    trackEvent('cv_pdf_downloaded', {
      source,
      fileName: cvMeta.fileName,
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Top Navigation & Primary Download Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('backToWorkfolio')}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5">
            {cvMeta.exists ? (
              <Badge variant="success" className="font-mono text-[10px]">
                PDF • {cvMeta.sizeKb} KB • {t('updatedLabel')} {cvMeta.updatedAt}
              </Badge>
            ) : (
              <Badge variant="warning" className="font-mono text-[10px]">
                {t('missingPdfBadge')}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {pickLocalized(AUTHOR_PROFILE.fullName, locale)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              <span className="font-mono font-semibold text-primary">
                {pickLocalized(AUTHOR_PROFILE.roleTitle, locale)}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {pickLocalized(AUTHOR_PROFILE.location, locale)}
              </span>
            </div>
          </div>

          {/* Primary Download & Open Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={cvMeta.publicUrl}
              download={cvMeta.downloadFileName}
              onClick={() => handleDownloadClick('cv_page_primary_btn')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
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
        </div>

        {/* Direct Contacts Row */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
          <a
            href={AUTHOR_PROFILE.contacts.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Send className="h-3 w-3 text-primary" />
            <span>{AUTHOR_PROFILE.contacts.telegramHandle}</span>
          </a>
          <a
            href={AUTHOR_PROFILE.contacts.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Linkedin className="h-3 w-3 text-primary" />
            <span>{AUTHOR_PROFILE.contacts.linkedinHandle}</span>
          </a>
          <a
            href={AUTHOR_PROFILE.contacts.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Github className="h-3 w-3 text-primary" />
            <span>{AUTHOR_PROFILE.contacts.githubHandle}</span>
          </a>
          <a
            href={`mailto:${AUTHOR_PROFILE.contacts.email}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Mail className="h-3 w-3 text-primary" />
            <span>{AUTHOR_PROFILE.contacts.email}</span>
          </a>
        </div>
      </div>

      {/* Mode Switcher: Visual PDF Document vs Full Structured Web Resume */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode('pdf')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              viewMode === 'pdf'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>{t('tabPdfPreview')}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('structured')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              viewMode === 'structured'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5 text-primary" />
            <span>{t('tabStructuredCv')}</span>
          </button>
        </div>

        <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">{t('mobileViewerHint')}</span>
      </div>

      {viewMode === 'pdf' ? (
        <div className="space-y-4">
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
              <button
                type="button"
                onClick={() => setViewMode('structured')}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs font-medium text-foreground"
              >
                <LayoutList className="h-3.5 w-3.5 text-primary" />
                <span>{t('tabStructuredCv')}</span>
              </button>
            </div>
          </div>

          {/* Embedded PDF Frame */}
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-md">
            <object
              data={`${cvMeta.publicUrl}#view=FitH`}
              type="application/pdf"
              aria-label="Stanislav Krychevskyi CV PDF"
              className="h-[72dvh] min-h-[520px] w-full md:h-[84dvh] md:min-h-[760px]"
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
        </div>
      ) : (
        /* Full Structured Web / ATS Resume (All 6 Roles, Skills, Courses, Education) */
        <article className="space-y-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          {/* Summary */}
          <section className="space-y-2 border-b border-border/60 pb-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              {t('summaryHeading')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">{tHero('description')}</p>
          </section>

          {/* Hard Skills */}
          <section className="space-y-3 border-b border-border/60 pb-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              {t('hardSkillsHeading')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {AUTHOR_SKILL_GROUPS.map((group) => (
                <div key={group.id} className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
                  <div className="font-mono text-[11px] font-semibold text-foreground">
                    {pickLocalized(group.label, locale)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="bg-background font-mono text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* All 6 Commercial Roles Expanded */}
          <section className="space-y-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                {t('experienceHeading')}
              </h2>
            </div>

            <div className="space-y-5">
              {COMMERCIAL_EXPERIENCE.map((role) => {
                const points = role.highlights[locale] ?? role.highlights.en
                return (
                  <div key={role.id} className="rounded-xl border border-border/70 bg-background p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{role.company}</h3>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {pickLocalized(role.domain, locale)}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-primary">{pickLocalized(role.engagement, locale)}</p>
                        {role.projects.length > 0 ? (
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {role.projects.join(' / ')}
                          </p>
                        ) : null}
                      </div>

                      <Badge variant="outline" className="w-fit shrink-0 font-mono text-xs">
                        {pickLocalized(role.period, locale)}
                      </Badge>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-2.5">
                      {role.technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="font-mono text-[10px]">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Education, Courses & Spoken Languages */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                <GraduationCap className="h-4 w-4" />
                <span>{t('educationHeading')}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                {pickLocalized(AUTHOR_PROFILE.education.degree, locale)}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {pickLocalized(AUTHOR_PROFILE.education.institution, locale)}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Award className="h-4 w-4" />
                <span>{t('coursesHeading')}</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {AUTHOR_PROFILE.courses.map((course) => (
                  <li key={course}>• {course}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Languages className="h-4 w-4" />
                <span>{t('languagesHeading')}</span>
              </div>
              <div className="mt-2 text-xs font-medium leading-relaxed text-foreground">
                {pickLocalized(AUTHOR_PROFILE.spokenLanguages, locale)}
              </div>
            </div>
          </section>
        </article>
      )}
    </div>
  )
}
