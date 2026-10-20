# LanguageSelector doesn't validate language code from URL before using it

Fix for issue #683: the language code from `next-intl`'s `useLocale()` is consumed without first checking it against the supported list, so a stale or tampered `NEXT_LOCALE` cookie / URL segment could flow through and cause a 404 (locale not found) at render time.

## #683 - LanguageSelector doesn't validate language code from URL before using it

`src/components/LanguageSelector.tsx` reads the current locale via `useLocale()` and casts it to `SupportedLocale` without validating it:

```tsx
// src/components/LanguageSelector.tsx — current behaviour
const locale = useLocale() as SupportedLocale;
```

A `isSupportedLocale` guard already exists in the file but is only used to clean up a bad persisted cookie in a `useEffect` — the active `locale` itself is never checked. A locale coming from the URL/cookie that isn't in `supportedLocales` is treated as a valid `SupportedLocale`, which can lead to a 404 / missing-message runtime when the rest of the app tries to load messages for an unsupported locale.

**Done**
- Validate the `useLocale()` result with `isSupportedLocale` before using it; fall back to `DEFAULT_LOCALE` ('en') when it isn't recognised.
- When an invalid locale is detected, write the default-locale cookie and reload the document so the server re-renders with a valid locale — same mechanism already used by `handleLocaleChange`.
- `handleLocaleChange` already early-returns on unsupported locales, so only the render-path guard is new.
- Guard runs in the component body (before any rendering that would use `locale`), not just in a `useEffect`, so an invalid locale never reaches the render output.

**Implementation sketch**

```tsx
const rawLocale = useLocale();
const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

useEffect(() => {
  if (rawLocale !== undefined && !isSupportedLocale(rawLocale)) {
    writeLocaleCookie(DEFAULT_LOCALE);
    // only reload once, on the mismatch render
    window.location.reload();
  }
}, [rawLocale]);
```

A single reload is enough because, after the cookie is rewritten, the server re-renders with the default locale. The reload is guarded so it doesn't loop: after reload `useLocale()` returns the default locale, which passes `isSupportedLocale`, so the effect's condition is false.

**Not done in this PR**
- Hardening the server-side middleware in `src/i18n/negotiate.ts` to reject/redirect unknown locale segments at the edge (this PR only fixes the client component).
- A shared `useSafeLocale()` hook to centralise the guard across other consumers of `useLocale()`.

## Verification

`npm run typecheck`, `npm run lint`, `npm run build` all pass.

Part of #683
