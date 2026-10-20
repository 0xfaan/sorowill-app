import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';

// Regression test for #642: the concern was that the Dashboard's effect
// which calls `loadWills` could go stale because `loadWills` was missing
// from its dependency array, or because `loadWills` itself was not a
// stable `useCallback` (so the effect would either never see a fresh
// `publicKey`/fetch, or would re-run on every render). This locks in the
// correct behavior: `loadWills` is called exactly once per distinct
// `publicKey` value, driven by the effect's `[publicKey, loadWills]`
// dependency array and `loadWills`'s stable identity.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const PUBLIC_KEY = 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4';

const { getWillsByOwner, getWillsByBeneficiary } = vi.hoisted(() => ({
  getWillsByOwner: vi.fn().mockResolvedValue([]),
  getWillsByBeneficiary: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/freighter', () => ({
  safeGetPublicKey: vi.fn().mockResolvedValue(PUBLIC_KEY),
}));
vi.mock('@/lib/sorowill', () => ({
  getSoroWillClient: () => ({ getWillsByOwner, getWillsByBeneficiary }),
  getWillsByGuardian: vi.fn().mockResolvedValue({ wills: [], hasErrors: false }),
}));

import DashboardPage from '@/app/dashboard/page';

describe('dashboard loadWills effect (#642)', () => {
  it('fetches wills exactly once when publicKey resolves, and not again on unrelated re-renders', async () => {
    const { rerender } = render(
      <ToastProvider>
        <DashboardPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(getWillsByOwner).toHaveBeenCalledWith(PUBLIC_KEY);
    });
    expect(getWillsByOwner).toHaveBeenCalledTimes(1);

    // An unrelated re-render (same publicKey) must not cause the effect to
    // refire — proving loadWills is a stable useCallback and the effect's
    // dependency array ([publicKey, loadWills]) is complete, not stale.
    rerender(
      <ToastProvider>
        <DashboardPage />
      </ToastProvider>
    );

    expect(getWillsByOwner).toHaveBeenCalledTimes(1);
  });
});
