import { cache } from 'react';
import type { Will } from '@sorowill/sdk';

import { getSoroWillClient } from '@/lib/sorowill';
import { formatTokenBalance } from '@/lib/tokenDecimals';

/**
 * Request-scoped cached fetch of a will by ID.
 *
 * Next.js calls `generateMetadata` and the page component in the same
 * server-side request, and both need the will record. Without caching, that
 * means two identical RPC round-trips per page load. `cache()` memoizes the
 * call by argument list for the lifetime of the current request, collapsing
 * them into one.
 *
 * Not to be used from Client Components — `cache()` is a React Server
 * Component primitive and has no meaning on the client.
 */
export const getCachedWill = cache(async (id: string): Promise<Will> => {
  return getSoroWillClient().getWill(id);
});

/**
 * Builds the `description` string used in link previews / SEO metadata for
 * a will. Uses the token's real decimal count (via `formatTokenBalance`)
 * instead of a hardcoded 6-decimal divisor, and never labels an unknown
 * token as "USDC".
 *
 * The balance is formatted from the raw base-unit string with `BigInt`, so
 * large balances keep full precision (no `Number()` truncation).
 *
 * No symbol is appended because the token registry is a decimals-only map:
 * `will.token` is a contract address, and resolving a human-readable symbol
 * would require an extra on-chain lookup that `generateMetadata` should not
 * perform. The result reads naturally without it, e.g.
 * `"Status: Active. Locked balance: 1,234.5678901. 3 beneficiaries."`
 */
export function buildWillMetadataDescription(will: Will): string {
  const formattedBalance = formatTokenBalance(will.balance, will.token);
  const beneficiaryCount = will.beneficiaries.length;
  return `Status: ${will.status}. Locked balance: ${formattedBalance}. ${beneficiaryCount} beneficiaries.`;
}
