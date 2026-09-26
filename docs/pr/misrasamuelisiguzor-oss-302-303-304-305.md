# Dispatch auth timing, NEXT_PUBLIC_ guard, will/new render purity, confirmation modal a11y

Each issue gets its core fix plus tests. The remaining acceptance criteria are listed under "Not done in this PR".

## #302 - security hardening theme

Already on `main`: the `npm audit --audit-level=high` CI job (#76), and `/api/reminders/dispatch` rejects requests when `CRON_SECRET` is unset (#177).

**Done**
- #281: the dispatch route compares `Authorization` against `Bearer ${CRON_SECRET}` with `crypto.timingSafeEqual` (with a length check first), and still rejects requests when the secret is unset, so the #281 and #177 fixes don't conflict.
- `tests/unit/reminders-dispatch-auth.test.ts`: exact token -> 200; wrong token (same and different length), missing prefix, empty or absent header -> 401; unset secret -> 401.

**Not done in this PR**
- #213 / #265 (verification URL leaked to third-party image APIs).
- #176 / #260 / #261 reminder-endpoint ownership gaps.
- Re-audit of #43, #44, #46, #50, #77, #82, #96 and the single sign-off for the set.

## #303 - env var validation and safety net

Already on `main`: `.nvmrc` pins Node 20 (#86).

**Done**
- #82: `tests/unit/public-env-safeguard.test.ts` scans `src/**` and `.env.example` for `NEXT_PUBLIC_*` names matching `SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|...` and fails if any are found. It runs in the existing CI `npm run test` step. Checked against a planted `NEXT_PUBLIC_CRON_SECRET`, which it catches.

**Not done in this PR**
- #96: runtime schema validation of all consumed env vars at startup / build.

## #304 - `setState` inside `useMemo` in `will/new`

**Done**
- New `src/lib/useStableRowIds.ts`: row ids are derived purely from `useId()` + row index inside `useMemo`, with no state setter and no effect. It behaves the same as before (an index keeps its id for the component's lifetime). `will/new/page.tsx` uses it in place of the `guardianIds` state + side-effecting `useMemo`.
- `tests/unit/useStableRowIds.test.tsx` (under `<StrictMode>`): every row gets an id on first render, ids are stable across re-renders and preserved when rows are added, and no React errors are logged.

**Not done in this PR**
- Creating ids in `addGuardian` / `removeGuardian` so a row's id follows the row, not the index, when a middle row is removed.
- Manual browser check for StrictMode warnings while adding/removing rows.

## #305 - DestructiveActionConfirmation modal behaviour

**Done**
- `aria-modal="true"` and `aria-labelledby` pointing at the heading.
- Escape calls `onCancel()` while open (listener only attached when `isOpen`).
- `tests/unit/DestructiveActionConfirmation.a11y.test.tsx` (new file; the existing `DestructiveActionConfirmation.test.tsx` is excluded in `vitest.config.ts`).

**Not done in this PR**
- Moving initial focus into the dialog on open.
- Tab / Shift+Tab focus trap.

## Verification

`npm run typecheck`, `npm run lint` (0 errors; warning count unchanged at 20), `npm run build` pass; `npm run test` 51 files / 371 tests pass.

Closes #302
Closes #303
Closes #304
Closes #305
