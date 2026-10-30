import { DEFAULT_LOCALE, type SupportedLocale, SupportedLocaleEnum } from '@repo/shared-schemas'
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const parsed = SupportedLocaleEnum.safeParse(requested)
  const locale: SupportedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
