/**
 * Supported locales for the application
 */
export const supportedLocales = ['en', 'es'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

/**
 * Quality weight of one Accept-Language entry. A missing q defaults to 1; a
 * malformed or out-of-range q is treated as 0 so it never produces `NaN`,
 * which would make the sort comparator inconsistent.
 */
function parseQuality(param: string | undefined): number {
  if (param === undefined) return 1;
  const quality = Number(param.trim().replace(/^q=/, ''));
  return Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0;
}

/**
 * Parse Accept-Language header to determine the best locale for the user.
 * Falls back to English if no supported locale matches.
 */
export function getLocaleFromAcceptLanguage(acceptLanguageHeader?: string): SupportedLocale {
  if (!acceptLanguageHeader) return 'en';

  // Parse the Accept-Language header to get preferred locales
  const preferredLocales = acceptLanguageHeader
    .split(',')
    .map((part) => {
      const [locale, q] = part.trim().split(';');
      return { locale: locale.split('-')[0].toLowerCase(), quality: parseQuality(q) };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(({ locale }) => locale);

  // Find the first preferred locale that we support
  for (const locale of preferredLocales) {
    if ((supportedLocales as readonly string[]).includes(locale)) {
      return locale as SupportedLocale;
    }
  }

  return 'en';
}
