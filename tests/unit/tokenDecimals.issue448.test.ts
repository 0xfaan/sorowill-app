/**
 * Regression test for #448.
 *
 * `getTokenDecimals`'s cache must be keyed per-network, not just per-contract
 * ID. The same contract address can mean a different token (with different
 * decimals) on testnet vs mainnet, so switching the active network must not
 * return a stale decimals value cached under the previous network.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { getTokenDecimals, clearTokenDecimalsCache } from '@/lib/tokenDecimals';

const TESTNET_USDC = 'CCW67HTGNFMXKFGRR2MKRB2V6DNFGBLXJOFKLDLNOICL5UX4YK7CPLAA';
const MAINNET_USDC = 'CBIELTK6YBZBBFXDGBTNMWCFMHBZLKR5CBKNTW6YCJLIBDWXBVJSF7FD';

afterEach(() => {
  window.localStorage.removeItem('sorowill_network');
  clearTokenDecimalsCache();
});

describe('getTokenDecimals — cache invalidation on network switch (#448)', () => {
  it('does not reuse a cached decimals value for the same contract ID after the network changes', () => {
    window.localStorage.setItem('sorowill_network', 'testnet');
    // Populate the cache for this contract ID on testnet (6 decimals there).
    expect(getTokenDecimals(TESTNET_USDC)).toBe(6);

    // Switch the active network. The same string is registered on mainnet
    // only as the native-token fallback entry, so the correct result (7,
    // not a stale cached 6) must be returned.
    window.localStorage.setItem('sorowill_network', 'mainnet');
    expect(getTokenDecimals(TESTNET_USDC)).toBe(7);

    // And the real mainnet USDC contract resolves independently, not to
    // whatever was cached for the testnet contract ID.
    expect(getTokenDecimals(MAINNET_USDC)).toBe(6);
  });

  it('re-resolves correctly when switching back to the original network', () => {
    window.localStorage.setItem('sorowill_network', 'testnet');
    expect(getTokenDecimals(TESTNET_USDC)).toBe(6);

    window.localStorage.setItem('sorowill_network', 'mainnet');
    expect(getTokenDecimals(TESTNET_USDC)).toBe(7);

    window.localStorage.setItem('sorowill_network', 'testnet');
    expect(getTokenDecimals(TESTNET_USDC)).toBe(6);
  });
});
