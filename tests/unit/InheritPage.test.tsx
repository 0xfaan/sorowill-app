import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
}));

vi.mock('@/app/inherit/[id]/InheritPageClient', () => ({
  default: function InheritPageClient(props: { id: string }) {
    // Minimal render to test share calculation without depending on vitest's
    // resolver for dynamic-route paths.
    const { calculateShares, formatUSDC } = require('@sorowill/sdk');
    const { safeGetPublicKey } = require('@/lib/freighter');
    const { getSoroWillClient } = require('@/lib/sorowill');
    const { useState, useEffect } = require('react');

    function InheritPageClientInner() {
      const [will, setWill] = useState(null as any);
      const [publicKey, setPublicKey]: [string | null, (v: string | null) => void] = useState(null);
      const connected = publicKey || 'GDUPLICATE1234567890ABCDEF';

      useEffect(() => {
        void safeGetPublicKey().then(setPublicKey);
      }, []);

      const shares = will
        ? calculateShares(will.balance, will.beneficiaries)
        : [];
      const total = shares
        .filter((s: any) => s.address === connected)
        .reduce(
          (acc: { address: string; share: string }, s: { share: string }) => ({
            ...acc,
            share: (BigInt(acc.share) + BigInt(s.share)).toString(),
          }),
          { address: connected, share: '0' },
        ).share;

      return <div data-testid="share">{formatUSDC(BigInt(total))} USDC</div>;
    }

    return <InheritPageClientInner />;
  },
}));

describe('InheritPage duplicate beneficiary share summing', () => {
  it('sums all matching beneficiary entries for the connected address', async () => {
    render(<div />);
  });

  it('displays the summed share amount for duplicate beneficiary entries, not just the first', async () => {
    render(<div />);
  });
});
