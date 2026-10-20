/**
 * Regression test for #445.
 *
 * BeneficiaryForm must reject a percentage split that only sums to 100 if you
 * round each value, but whose *unrounded* inputs do not actually sum to 100
 * (e.g. three beneficiaries each entered as 33.33, which sums to 99.99 raw
 * and would round to 99 as well — never silently accepted as "100%").
 *
 * This locks in existing behavior; no bug was found in the current code, but
 * this guards against a future regression.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Beneficiary } from '@sorowill/sdk';
import { BeneficiaryForm } from '@/components/BeneficiaryForm';

function status(beneficiaries: Beneficiary[]) {
  render(<BeneficiaryForm value={beneficiaries} onChange={vi.fn()} />);
  return screen.getByRole('status');
}

describe('BeneficiaryForm percentage validation (#445)', () => {
  it('rejects 33.33 + 33.33 + 33.33 (sums to 99.99, not 100)', () => {
    const el = status([
      { address: 'GAAA', percentage: 33.33 },
      { address: 'GBBB', percentage: 33.33 },
      { address: 'GCCC', percentage: 33.33 },
    ]);
    expect(el).not.toHaveTextContent('Total: 100% ✓');
    expect(el).toHaveTextContent('99.99');
  });

  it('accepts whole-number percentages that sum to exactly 100', () => {
    const el = status([
      { address: 'GAAA', percentage: 34 },
      { address: 'GBBB', percentage: 33 },
      { address: 'GCCC', percentage: 33 },
    ]);
    expect(el).toHaveTextContent('Total: 100% ✓');
  });

  it('rejects whole-number percentages that sum to 99, not 100', () => {
    const el = status([
      { address: 'GAAA', percentage: 33 },
      { address: 'GBBB', percentage: 33 },
      { address: 'GCCC', percentage: 33 },
    ]);
    expect(el).toHaveTextContent('Total must equal 100% (currently 99%)');
  });
});
