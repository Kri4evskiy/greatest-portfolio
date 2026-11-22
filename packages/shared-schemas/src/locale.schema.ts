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
    /** Standard IETF locale tag (BCP 47) consumed by `Intl.DateTimeFormat` / `Intl.NumberFormat`. */
    intlLocale: string
    ogLocale: string
    urlPrefix: string
  }
> = {
  en: {
    code: 'en',
    shortLabel: 'EN',
    nativeName: 'English',
    intlLocale: 'en-US',
    ogLocale: 'en_US',
    urlPrefix: '',
  },
  uk: {
    code: 'uk',
    shortLabel: 'UA',
    nativeName: 'Українська',
    intlLocale: 'uk-UA',
    ogLocale: 'uk_UA',
    urlPrefix: '/ua',
  },
  ru: {
    code: 'ru',
    shortLabel: 'RU',
    nativeName: 'Русский',
    intlLocale: 'ru-RU',
    ogLocale: 'ru_RU',
    urlPrefix: '/ru',
  },
}
