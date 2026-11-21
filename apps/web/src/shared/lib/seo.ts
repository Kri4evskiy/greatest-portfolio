import { DEFAULT_LOCALE, type SupportedLocale } from '@repo/shared-schemas'

const DEFAULT_SITE_URL = 'http://localhost:3000'

const LOCALE_URL_PREFIX_MAP: Record<SupportedLocale, string> = {
  en: '',
  uk: '/ua',
  ru: '/ru',
}

const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en_US',
  uk: 'uk_UA',
  ru: 'ru_RU',
}

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
  const prefix = LOCALE_URL_PREFIX_MAP[locale]

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
  return OG_LOCALE_MAP[locale]
}
