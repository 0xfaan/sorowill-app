# Error boundary, network a11y/mismatch, and percentage validation fixes

Partial fixes for four issues: the core bug in each is fixed and tested. The remaining acceptance criteria are listed under "Not done in this PR".

## #318 - `error.tsx` nests `<html>`/`<body>`

`src/app/error.tsx` is a route-segment boundary rendered inside `RootLayout`'s `<body>`, but it returned its own `<html lang="en"><body>`.

**Done**
- `error.tsx` now renders only its content (a wrapping `<div>`), so no nested `<html>`/`<body>` is produced.
- `tests/unit/RootError.test.tsx`: static-markup check that no `<html>`/`<body>` is emitted, plus a check that the message and "Try again" button still render.

**Not done in this PR**
- `src/app/global-error.tsx` with the `<html>`/`<body>` wrapper for root-layout failures.
- Logging the error / `error.digest` via `useEffect` and showing the digest to the user.

## #321 - NetworkSwitcher `<select>` has no accessible name

**Done**
- The network `<select>` has `aria-label="Stellar network"`.
- `tests/unit/NetworkSwitcher.test.tsx` now queries `getByRole('combobox', { name: /network/i })`.

**Not done in this PR**
- Removing the decorative `◍` glyph from the accessible option text.

## #322 - no mismatch warning for FUTURENET / STANDALONE wallets

`normalizeWalletNetwork` returns `null` for networks it doesn't recognise, and `check()` treated `null` as "no mismatch".

**Done**
- `check()` now flags a mismatch whenever the normalised wallet network differs from the app network, including `null` (unrecognised). The banner names the raw wallet network (e.g. `FUTURENET`).
- `tests/unit/NetworkMismatchBanner.unknown-network.test.tsx`: FUTURENET, STANDALONE and an unknown string each render the banner naming that network (all three fail on `main`).

**Not done in this PR**
- Replacing substring matching (`includes('test')`, `includes('main')`) with exact case-insensitive matching of Freighter identifiers.
- Tests for TESTNET and PUBLIC.

## #325 - percentage input truncates `33.5` and can't be cleared

**Done**
- The percentage `onChange` still clamps to 0-100 but no longer `Math.floor`s, so `33.5` reaches `getBeneficiaryValidationMessage` and the existing "Percentages must be whole numbers" message is shown.
- `tests/unit/BeneficiaryForm.nonInteger.test.tsx`: typing `33.5` keeps the value and shows the message (fails on `main`).

**Not done in this PR**
- Letting the field be cleared while editing (empty string is still coerced to `0`); tracking empty state separately from the numeric value.

## Verification

`npm run typecheck`, `npm run lint`, `npm run build` all pass; `npm run test` 50 files / 361 tests pass.

Part of #318
Part of #321
Part of #322
Part of #325
