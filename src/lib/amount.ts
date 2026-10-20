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

/**
 * Top-up amount validator used inline in the will detail UI. Delegates to
 * isValidAmount so both validators reject scientific notation the same way.
 */
export function isTopUpAmountValid(amount: string): boolean {
  return isValidAmount(amount);
}

/**
 * Returns the subset of `willIds` whose batch top-up amount is missing or
 * invalid. An amount is invalid if it is absent, empty, non-positive, written
 * in scientific notation (e.g. '1e5'), or otherwise not parseable by
 * toStroops(). Used to gate the batch top-up submit button and to skip bad
 * entries before calling the contract.
 */
export function getInvalidBatchAmounts(
  willIds: string[],
  amounts: Record<string, string>,
): string[] {
  return willIds.filter((willId) => {
    const amount = amounts[willId];
    return amount === undefined || !isValidAmount(amount);
  });
}

/** Values below this are formatted with their full token precision. */
const SMALL_AMOUNT_THRESHOLD = 0.01;

/**
 * Formats a human-unit token amount (e.g. `0.0001` USDC) for display.
 *
 * Amounts >= 0.01 use two fraction digits with thousands separators
 * (`1000000` → `'1,000,000.00'`). Smaller non-zero amounts keep up to
 * `decimals` fraction digits so they never collapse to `'0.00'`
 * (`0.0001` → `'0.0001'`). Non-zero amounts below the token's smallest unit
 * render as `'< 0.000001'` (for 6 decimals) rather than a misleading zero.
 *
 * @param amount - Amount in whole-token units
 * @param decimals - Token decimal places (defaults to 6, USDC)
 */
export function formatAmount(amount: number, decimals = 6): string {
  if (!Number.isFinite(amount) || amount === 0) {
    return '0.00';
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const maxDigits = Math.min(Math.max(Math.trunc(decimals), 2), 20);

  if (abs >= SMALL_AMOUNT_THRESHOLD) {
    return (
      sign +
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(abs)
    );
  }

  const smallestUnit = 10 ** -maxDigits;
  if (abs < smallestUnit) {
    return `${sign ? '> -' : '< '}${smallestUnit.toFixed(maxDigits)}`;
  }

  return (
    sign +
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDigits,
    }).format(abs)
  );
}
