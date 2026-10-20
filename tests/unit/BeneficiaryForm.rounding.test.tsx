import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Beneficiary } from '@sorowill/sdk';
import { BeneficiaryForm } from '@/components/BeneficiaryForm';

function status(beneficiaries: Beneficiary[]) {
  render(<BeneficiaryForm value={beneficiaries} onChange={vi.fn()} />);
  return screen.getByRole('status');
}

describe('BeneficiaryForm percentage rounding (#385)', () => {
  it('rejects 33.33 + 33.33 + 33.34 and warns that rounding gives 99%', () => {
    const el = status([
      { address: 'GAAA', percentage: 33.33 },
      { address: 'GBBB', percentage: 33.33 },
      { address: 'GCCC', percentage: 33.34 },
    ]);
    expect(el).toHaveTextContent('Total: 100%');
    expect(el).toHaveTextContent('Percentages must be whole numbers');
    expect(el).toHaveTextContent('rounding would give 33% + 33% + 33% = 99%');
    expect(el).not.toHaveTextContent('✓');
  });

  it('accepts 50 + 50', () => {
    expect(
      status([
        { address: 'GAAA', percentage: 50 },
        { address: 'GBBB', percentage: 50 },
      ]),
    ).toHaveTextContent('Total: 100% ✓');
  });

  it('accepts 25 + 25 + 25 + 25', () => {
    expect(
      status([
        { address: 'GAAA', percentage: 25 },
        { address: 'GBBB', percentage: 25 },
        { address: 'GCCC', percentage: 25 },
        { address: 'GDDD', percentage: 25 },
      ]),
    ).toHaveTextContent('Total: 100% ✓');
  });

  it('rejects more than 2 decimal places', () => {
    expect(
      status([
        { address: 'GAAA', percentage: 33.333 },
        { address: 'GBBB', percentage: 66.667 },
      ]),
    ).toHaveTextContent('at most 2 decimal places');
  });
});
