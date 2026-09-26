import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { getLocaleFromAcceptLanguage, supportedLocales } from './negotiate';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale resolves from the locale the middleware determined (via
  // the NEXT_LOCALE cookie or Accept-Language) without re-entering this
  // config resolver — calling next-intl/server's getLocale() here instead
  // would recurse into getRequestConfig and blow the call stack.
  const candidate = await requestLocale;
  const locale =
    candidate && (supportedLocales as readonly string[]).includes(candidate)
      ? candidate
      : getLocaleFromAcceptLanguage((await headers()).get('accept-language') ?? undefined);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
