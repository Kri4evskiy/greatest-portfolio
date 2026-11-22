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
    bcp47Tag: string
    ogLocale: string
    urlPrefix: string
  }
> = {
  en: {
    code: 'en',
    shortLabel: 'EN',
    nativeName: 'English',
    bcp47Tag: 'en-US',
    ogLocale: 'en_US',
    urlPrefix: '',
  },
  uk: {
    code: 'uk',
    shortLabel: 'UA',
    nativeName: 'Українська',
    bcp47Tag: 'uk-UA',
    ogLocale: 'uk_UA',
    urlPrefix: '/ua',
  },
  ru: {
    code: 'ru',
    shortLabel: 'RU',
    nativeName: 'Русский',
    bcp47Tag: 'ru-RU',
    ogLocale: 'ru_RU',
    urlPrefix: '/ru',
  },
}
