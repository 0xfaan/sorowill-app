import { describe, it, expect } from 'vitest';
import { isValidAmount, formatAmount } from '@/lib/amount';

describe('isValidAmount', () => {
  it('should accept valid decimal amounts', () => {
    expect(isValidAmount('100')).toBe(true);
    expect(isValidAmount('100.50')).toBe(true);
    expect(isValidAmount('0.01')).toBe(true);
    expect(isValidAmount('1000000.99')).toBe(true);
  });

  it('should reject scientific notation', () => {
    expect(isValidAmount('1e5')).toBe(false);
    expect(isValidAmount('1E5')).toBe(false);
    expect(isValidAmount('1.5e2')).toBe(false);
    expect(isValidAmount('1.5E2')).toBe(false);
  });

  it('should reject empty and whitespace strings', () => {
    expect(isValidAmount('')).toBe(false);
    expect(isValidAmount('   ')).toBe(false);
  });

  it('should reject non-positive numbers', () => {
    expect(isValidAmount('0')).toBe(false);
    expect(isValidAmount('-100')).toBe(false);
  });

  it('should reject non-numeric strings', () => {
    expect(isValidAmount('abc')).toBe(false);
    expect(isValidAmount('100abc')).toBe(false);
  });

  it('should handle leading/trailing whitespace', () => {
    expect(isValidAmount('  100  ')).toBe(true);
    expect(isValidAmount('  100.50  ')).toBe(true);
  });
});

describe('formatAmount', () => {
  it('formats zero as "0"', () => {
    expect(formatAmount(0)).toBe('0');
  });

  it('formats very small values without rounding to zero', () => {
    expect(formatAmount(0.000001)).toBe('1.0000e-6');
    expect(formatAmount(0.0001)).toBe('1.0000e-4');
  });

  it('formats normal values as fixed-point', () => {
    expect(formatAmount(1)).toBe('1.00');
    expect(formatAmount(1000000)).toBe('1000000.00');
  });

  it('respects token decimals while trimming trailing zeros', () => {
    expect(formatAmount(1.5, 6)).toBe('1.50');
    expect(formatAmount(1.123456, 6)).toBe('1.123456');
  });
});
