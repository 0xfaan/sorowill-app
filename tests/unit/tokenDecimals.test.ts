import { describe, it, expect } from 'vitest';
import { getTokenDecimals, formatTokenBalance } from '@/lib/tokenDecimals';

describe('getTokenDecimals', () => {
  it('resolves testnet USDC to 6 decimals', () => {
    const testnetUsdc = 'CCW67HTGNFMXKFGRR2MKRB2V6DNFGBLXJOFKLDLNOICL5UX4YK7CPLAA';
    expect(getTokenDecimals(testnetUsdc)).toBe(6);
    expect(getTokenDecimals(testnetUsdc.toLowerCase())).toBe(6);
  });

  it('falls back to 7 decimals for unrecognised token contract addresses', () => {
    const unknownToken = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';
    expect(getTokenDecimals(unknownToken)).toBe(7);
  });
});

describe('formatTokenBalance precision and formatting', () => {
  it('preserves exact precision for balances larger than MAX_SAFE_INTEGER without parseFloat rounding', () => {
    // 9,007,199,254,740,993 > Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
    // 9007199254740993000000 base units at 6 decimals = 9,007,199,254,740,993.000000
    const hugeBalance = '9007199254740993000000';
    const formatted = formatTokenBalance(hugeBalance, 'any', 6);
    expect(formatted).toBe('9,007,199,254,740,993.000000');
  });

  it('formats 7-decimal balances with exact fractional digits', () => {
    const balance = '12345678901'; // 1,234.5678901
    expect(formatTokenBalance(balance, 'any', 7)).toBe('1,234.5678901');
  });

  it('formats zero balance correctly without NaN or formatting artifacts', () => {
    expect(formatTokenBalance('0', 'any', 6)).toBe('0.000000');
    expect(formatTokenBalance(0n, 'any', 7)).toBe('0.0000000');
  });

  it('handles negative balances correctly', () => {
    expect(formatTokenBalance('-1000000', 'any', 6)).toBe('-1.000000');
    expect(formatTokenBalance(-500000n, 'any', 6)).toBe('-0.500000');
  });

  it('handles 0 decimals gracefully', () => {
    expect(formatTokenBalance('1234', 'any', 0)).toBe('1,234');
    expect(formatTokenBalance('-1234', 'any', 0)).toBe('-1,234');
  });
});
