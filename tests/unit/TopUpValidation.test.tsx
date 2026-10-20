import { describe, it, expect } from 'vitest';
import { isTopUpAmountValid } from '@/lib/amount';

describe('Top Up Amount Format Validation', () => {
  it('rejects empty or whitespace inputs', () => {
    expect(isTopUpAmountValid('')).toBe(false);
    expect(isTopUpAmountValid('   ')).toBe(false);
  });

  it('rejects non-numeric inputs like "abc"', () => {
    expect(isTopUpAmountValid('abc')).toBe(false);
    expect(isTopUpAmountValid('12abc')).toBe(false);
  });

  it('rejects zero and negative numbers', () => {
    expect(isTopUpAmountValid('0')).toBe(false);
    expect(isTopUpAmountValid('0.00')).toBe(false);
    expect(isTopUpAmountValid('-5')).toBe(false);
    expect(isTopUpAmountValid('-0.01')).toBe(false);
  });

  it('rejects non-finite values like "Infinity" and "1e309"', () => {
    expect(isTopUpAmountValid('Infinity')).toBe(false);
    expect(isTopUpAmountValid('1e309')).toBe(false);
  });

  it('accepts valid positive numbers', () => {
    expect(isTopUpAmountValid('1')).toBe(true);
    expect(isTopUpAmountValid('0.01')).toBe(true);
    expect(isTopUpAmountValid('100.50')).toBe(true);
  });
});
