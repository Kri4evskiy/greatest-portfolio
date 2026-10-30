import { z } from 'zod'

export const SupportedLocaleEnum = z.enum(['en', 'uk', 'ru'])

export type SupportedLocale = z.infer<typeof SupportedLocaleEnum>

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'uk', 'ru'] as const

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LOCALE_METADATA: Record<
  SupportedLocale,
  {
    code: SupportedLocale
    shortLabel: string
    nativeName: string
  }
> = {
  en: {
    code: 'en',
    shortLabel: 'EN',
    nativeName: 'English',
  },
  uk: {
    code: 'uk',
    shortLabel: 'UA',
    nativeName: 'Українська',
  },
  ru: {
    code: 'ru',
    shortLabel: 'RU',
    nativeName: 'Русский',
  },
}
