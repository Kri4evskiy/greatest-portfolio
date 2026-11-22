import { DEFAULT_LOCALE, LOCALE_METADATA, type SupportedLocale } from '@repo/shared-schemas'

const DEFAULT_SITE_URL = 'http://localhost:3000'

export function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) {
    return DEFAULT_SITE_URL
  }

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return DEFAULT_SITE_URL
    }
    return parsed.origin
  } catch {
    return DEFAULT_SITE_URL
  }
}

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
  return `${resolveSiteUrl()}${buildLocalizedPath(pathname, locale)}`
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

export function serializeSafeJsonLd(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c')
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

  return serializeSafeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.title,
    description: input.description,
    url: articleUrl,
    inLanguage: input.locale,
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    keywords: input.tags.join(', '),
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: buildLocalizedUrl('/', input.locale),
    },
  })
}
