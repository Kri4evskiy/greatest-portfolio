import { DEFAULT_LOCALE, type SupportedLocale, SupportedLocaleEnum } from '@repo/shared-schemas'
import * as rootParams from 'next/root-params'
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const paramValue = await rootParams.locale()
  const parsed = SupportedLocaleEnum.safeParse(paramValue)
  const locale: SupportedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
