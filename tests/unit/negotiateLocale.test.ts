import { getLocaleFromAcceptLanguage } from '@/i18n/negotiate';

describe('getLocaleFromAcceptLanguage (#317)', () => {
  it.each([
    ['es-MX,es;q=0.9,en;q=0.8', 'es'],
    ['en', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    ['fr', 'en'],
    ['fr;q=1,es;q=0.5', 'es'],
  ])('%j -> %s', (header, expected) => {
    expect(getLocaleFromAcceptLanguage(header)).toBe(expected);
  });

  it('ranks a malformed q-value below well-formed ones instead of producing NaN', () => {
    expect(getLocaleFromAcceptLanguage('es;q=abc,en;q=0.5')).toBe('en');
    expect(getLocaleFromAcceptLanguage('en;q=abc,es')).toBe('es');
    expect(getLocaleFromAcceptLanguage('en;q=5,es;q=0.1')).toBe('es');
  });
});
