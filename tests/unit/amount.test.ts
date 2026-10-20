import { describe, it, expect } from 'vitest';
import { formatAmount, isValidAmount } from '@/lib/amount';

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
  it('preserves decimals for amounts smaller than 0.01', () => {
    expect(formatAmount(0.000001)).toBe('0.000001');
    expect(formatAmount(0.0001)).toBe('0.0001');
  });

  it('uses two fraction digits and separators for regular amounts', () => {
    expect(formatAmount(1)).toBe('1.00');
    expect(formatAmount(1000000)).toBe('1,000,000.00');
  });

  it('respects token decimals and never shows a non-zero amount as zero', () => {
    expect(formatAmount(0.0000001)).toBe('< 0.000001');
    expect(formatAmount(0.0000001, 7)).toBe('0.0000001');
    expect(formatAmount(0)).toBe('0.00');
  });
});
