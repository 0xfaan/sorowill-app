# Mobile header controls, pure theme toggle, wallet error classification, BroadcastChannel fallback

Each issue gets its core fix plus tests. The remaining acceptance criteria are listed under "Not done in this PR".

## #319 - header controls unreachable on mobile

**Done**
- `<HeaderContextArea />` (language, network, theme, wallet) moved out of the `hidden sm:flex` nav, so it renders at every width; only the Dashboard / Create links remain desktop-only. Kept as a single instance, so `WalletConnect` / `NetworkMismatchBanner` are not duplicated.
- `tests/unit/HeaderMobileControls.test.tsx`: none of the four controls sit inside a `hidden` ancestor (fails on `main`).

**Not done in this PR**
- Menu button (`aria-expanded` / `aria-controls`) + disclosure panel for Dashboard / Create links, closing on route change and Escape.
- Manual verification at 320 / 375 / 768 px with screenshots.

## #320 - ThemeProvider side effects in updater, unvalidated stored theme

**Done**
- `toggleTheme` computes the next theme, calls `setTheme(next)`, then writes `localStorage` / `data-theme` outside the updater.
- The fallback path only trusts a stored `'light' | 'dark'` (matching `public/theme-init.js`); anything else uses the OS preference.
- `tests/unit/ThemeProvider.test.tsx`: stored `'blue'` falls back to the OS preference (fails on `main`); toggling under `<StrictMode>` writes `theme` exactly once and updates `data-theme`.

**Not done in this PR**
- try/catch around `localStorage` reads/writes, and the throwing-`localStorage` test.

## #323 - classifyError over-reports "Freighter not installed"

**Done**
- `classifyError` (now exported for testing) checks declined/denied/rejected first, and only treats an explicit `'not installed'` message as a missing extension; the `'Freighter'` and `'not found'` substring matches are gone.
- `tests/unit/WalletConnect.classifyError.test.ts`: not installed, declined (including a message mentioning Freighter), `'Account not found'` -> generic, other errors -> generic.

Note: `@stellar/freighter-api` only emits "Node environment is not supported" and a generic internal-error message, so the removed substrings never matched a real not-installed case.

**Not done in this PR**
- Detecting installation with `isFreighterInstalled()` from the SDK.

## #324 - BroadcastChannel missing breaks the header

**Done**
- `openWalletChannel()` returns `null` when `BroadcastChannel` is undefined; the mount effect, `handleConnect` and `handleClearSession` all use it and fall back to single-tab behaviour.
- `tests/unit/WalletConnect.noBroadcastChannel.test.tsx`: with `BroadcastChannel` removed from the global, the component renders, connects and disconnects (on `main` it throws "BroadcastChannel is not a constructor").

**Not done in this PR**
- `role="alert"` on the connect error.

## Verification

`npm run typecheck`, `npm run lint` (0 errors, no new warnings), `npm run build` pass; `npm run test` 51 files / 363 tests pass.

Closes #319
Closes #320
Closes #323
Closes #324
