import { toStroops } from '@sorowill/sdk';

/** Smallest magnitude we're willing to show with plain fixed-point decimals. */
const MIN_FIXED_POINT_MAGNITUDE = 0.01;

/**
 * Formats a token amount for display, avoiding the "0.00"-for-everything-tiny
 * problem that plain `Intl.NumberFormat`/`toFixed(2)` rounding produces.
 *
 * - Zero is always shown as "0".
 * - Amounts with magnitude >= 0.01 are shown as fixed-point decimals,
 *   respecting `decimals` (the token's on-chain decimal precision, e.g. 6
 *   for USDC) but trimming trailing zeros beyond 2 decimal places.
 * - Amounts with magnitude < 0.01 (but != 0) are shown in scientific
 *   notation so a small-but-nonzero balance never collapses to "0.00".
 *
 * @param amount - The numeric amount (already converted from base units).
 * @param decimals - The token's decimal precision (default 7, Stellar's native precision).
 */
export function formatAmount(amount: number, decimals = 7): string {
  if (!Number.isFinite(amount)) {
    return '0';
  }

  if (amount === 0) {
    return '0';
  }

  const magnitude = Math.abs(amount);
  const maxDecimals = Math.min(decimals, 20);

  if (magnitude < MIN_FIXED_POINT_MAGNITUDE) {
    // Preserve precision for very small values instead of rounding to 0.
    return amount.toExponential(Math.min(4, maxDecimals));
  }

  // Fixed-point, but trim unnecessary trailing zeros (minimum 2 decimals).
  const fixed = amount.toFixed(maxDecimals);
  const [whole, frac = ''] = fixed.split('.');
  let trimmedFrac = frac.replace(/0+$/, '');
  if (trimmedFrac.length < 2) {
    trimmedFrac = trimmedFrac.padEnd(2, '0');
  }
  return `${whole}.${trimmedFrac}`;
}

/**
 * Validates that an amount string can be successfully parsed by toStroops().
 * This rejects scientific notation (e.g., '1e5') and other invalid formats
 * that would cause toStroops() to throw.
 *
 * @param amount - The amount string to validate
 * @returns true if the amount is valid and can be safely passed to toStroops()
 */
export function isValidAmount(amount: string): boolean {
  const trimmed = amount.trim();
  
  // Empty strings are handled at a higher level
  if (trimmed === '') {
    return false;
  }

  // Check if the value can be converted to a positive number
  const num = Number(trimmed);
  if (isNaN(num) || num <= 0) {
    return false;
  }

  // Reject scientific notation (contains 'e' or 'E')
  if (/[eE]/.test(trimmed)) {
    return false;
  }

  // Try to call toStroops to ensure it doesn't throw
  try {
    toStroops(trimmed);
    return true;
  } catch {
    return false;
  }
}
