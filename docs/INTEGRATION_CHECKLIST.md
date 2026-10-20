# Component & Utility Integration Checklist

This checklist tracks fully-built components and utilities across the codebase to ensure no completed features sit dead/unwired in the tree (#287).

## Component / Function Status

| Feature / Component | Source Path | Wiring Call Site | Status |
|---|---|---|---|
| `exportWillsToCSV` / `validateExportData` (#184) | `src/lib/willExport.ts` | `src/app/dashboard/page.tsx` (Export CSV button) | Wired & Active |
| `useKeyboardShortcuts` (#193) | `src/lib/useKeyboardShortcuts.ts` | `src/app/dashboard/page.tsx` (`n` for new will, `/` for search) | Wired & Active |
| `WalletConnect` error / retry states (#198) | `src/components/WalletConnect.tsx` | `src/components/HeaderContextArea.tsx` | Wired & Active |
| `WalletConnect` session persistence & auto-reconnect (#199) | `src/components/WalletConnect.tsx`, `src/lib/freighter.ts` | `src/app/layout-client.tsx` | Wired & Active |
| `BeneficiaryForm` validation & split (#200) | `src/components/BeneficiaryForm.tsx` | `src/app/will/new/page.tsx`, `src/app/will/[id]/page.tsx` | Wired & Active |
| `DestructiveActionConfirmation` (#202) | `src/components/DestructiveActionConfirmation.tsx` | `src/app/will/[id]/page.tsx` (Cancel Will), `src/components/NetworkSwitcher.tsx` | Wired & Active |

## Maintenance Rule

Any new reusable component added to `src/components/` or utility in `src/lib/` must be integrated into its destination route or story before PR merge to prevent dead code accumulation.
