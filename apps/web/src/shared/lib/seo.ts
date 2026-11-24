import { DEFAULT_LOCALE, LOCALE_METADATA, SUPPORTED_LOCALES, type SupportedLocale } from '@repo/shared-schemas'
import type { Metadata } from 'next'
import { resolvePublicSiteUrl } from '@/shared/config/env'

export const SITE_NAME = 'Stanislav Krychevskyi — Workfolio & Knowledge Base'

export function normalizeSeoPathname(pathname: string): string {
  const trimmed = pathname.trim()
  if (!trimmed || trimmed === '/') {
    return '/'
  }
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.replace(/\/+$/, '')
}

export function buildLocalizedPath(pathname: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const normalizedPath = normalizeSeoPathname(pathname)
  const prefix = LOCALE_METADATA[locale].urlPrefix

  if (normalizedPath === '/') {
    return prefix || '/'
  }
  return `${prefix}${normalizedPath}`
}

export function buildLocalizedUrl(pathname: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return `${resolvePublicSiteUrl()}${buildLocalizedPath(pathname, locale)}`
}

export function buildLanguageAlternatesMap(pathname: string): Record<string, string> {
  return {
    en: buildLocalizedUrl(pathname, 'en'),
    uk: buildLocalizedUrl(pathname, 'uk'),
    ru: buildLocalizedUrl(pathname, 'ru'),
    'x-default': buildLocalizedUrl(pathname, DEFAULT_LOCALE),
  }
}

export function buildPageAlternates(pathname: string, locale: SupportedLocale = DEFAULT_LOCALE) {
  return {
    canonical: buildLocalizedUrl(pathname, locale),
    languages: buildLanguageAlternatesMap(pathname),
  }
}

export function resolveOgLocale(locale: SupportedLocale): string {
  return LOCALE_METADATA[locale].ogLocale
}

export function resolveAlternateOgLocales(locale: SupportedLocale): string[] {
  return SUPPORTED_LOCALES.filter((candidate) => candidate !== locale).map(
    (candidate) => LOCALE_METADATA[candidate].ogLocale,
  )
}

export interface OpenGraphMetadataInput {
  title: string
  description: string
  pathname: string
  locale: SupportedLocale
  type?: 'website' | 'profile' | 'article'
  publishedTime?: string
  tags?: readonly string[]
}

/**
 * Shared OpenGraph metadata builder preventing Next.js shallow-merge loss of `siteName`
 * and populating `alternateLocale` consistently across all localized routes.
 */
export function buildOpenGraphMetadata(input: OpenGraphMetadataInput): NonNullable<Metadata['openGraph']> {
  const base = {
    title: input.title,
    description: input.description,
    url: buildLocalizedUrl(input.pathname, input.locale),
    siteName: SITE_NAME,
    locale: resolveOgLocale(input.locale),
    alternateLocale: resolveAlternateOgLocales(input.locale),
  }

  if (input.type === 'article') {
    return {
      ...base,
      type: 'article',
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.tags && input.tags.length > 0 ? { tags: [...input.tags] } : {}),
    }
  }

  return {
    ...base,
    type: input.type ?? 'website',
  }
}

export interface ProfilePageJsonLdInput {
  locale: SupportedLocale
  pathname: string
  fullName: string
  roleTitle: string
  description: string
  sameAs: readonly string[]
  knowsAbout: readonly string[]
}

export interface TechArticleJsonLdInput {
  locale: SupportedLocale
  pathname: string
  title: string
  description: string
  publishedAt: string
  authorName: string
  tags: readonly string[]
}

export interface BreadcrumbJsonLdItem {
  label: string
  pathname: string
}

export function serializeSafeJsonLd(payload: Record<string, unknown>): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function buildProfilePageJsonLd(input: ProfilePageJsonLdInput): string {
  const pageUrl = buildLocalizedUrl(input.pathname, input.locale)

  return serializeSafeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    inLanguage: input.locale,
    name: `${input.fullName} — ${input.roleTitle}`,
    description: input.description,
    mainEntity: {
      '@type': 'Person',
      name: input.fullName,
      jobTitle: input.roleTitle,
      url: buildLocalizedUrl('/', input.locale),
      sameAs: [...input.sameAs],
      knowsAbout: [...input.knowsAbout],
    },
  })
}

export function buildTechArticleJsonLd(input: TechArticleJsonLdInput): string {
  const articleUrl = buildLocalizedUrl(input.pathname, input.locale)
  const homeUrl = buildLocalizedUrl('/', input.locale)
  const ogImageUrl = buildLocalizedUrl('/opengraph-image', input.locale)

  return serializeSafeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.title,
    description: input.description,
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    image: ogImageUrl,
    inLanguage: input.locale,
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    keywords: input.tags.join(', '),
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: homeUrl,
    },
    publisher: {
      '@type': 'Person',
      name: input.authorName,
      url: homeUrl,
    },
  })
}

export function buildBreadcrumbListJsonLd(locale: SupportedLocale, items: readonly BreadcrumbJsonLdItem[]): string {
  return serializeSafeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: buildLocalizedUrl(item.pathname, locale),
    })),
  })
}
