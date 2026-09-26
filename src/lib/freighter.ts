import {
  connectWallet,
  getPublicKey,
  isFreighterInstalled,
  type WalletConnection,
} from '@sorowill/sdk';

const isBrowser = typeof window !== 'undefined';

/**
 * SSR-safe check for whether the Freighter extension is installed. Always
 * resolves `false` during server-side rendering, since the extension only
 * exists in the browser.
 */
export async function safeIsFreighterInstalled(): Promise<boolean> {
  if (!isBrowser) {
    return false;
  }
  return isFreighterInstalled();
}

/**
 * SSR-safe wrapper around `connectWallet`. Throws if called outside the
 * browser (e.g. during server rendering), since there is no wallet to
 * connect to.
 */
export async function safeConnectWallet(): Promise<WalletConnection> {
  if (!isBrowser) {
    throw new Error('connectWallet can only be called in the browser');
  }
  return connectWallet();
}

/**
 * SSR-safe wrapper around `getPublicKey`. Resolves `null` during server-side
 * rendering or if no wallet is currently connected, instead of throwing —
 * convenient for "is a wallet already connected?" checks on mount.
 */
export async function safeGetPublicKey(): Promise<string | null> {
  if (!isBrowser) {
    return null;
  }
  try {
    return await getPublicKey();
  } catch {
    return null;
  }
}

/**
 * SSR-safe wrapper around the Freighter API's `getNetwork`. Resolves
 * with the wallet's currently selected network and passphrase, or null
 * if Freighter is not installed, not connected, or called during SSR.
 */
export async function safeGetWalletNetwork(): Promise<{
  network: string;
  networkPassphrase: string;
} | null> {
  if (!isBrowser) {
    return null;
  }
  try {
    // Dynamic import: @stellar/freighter-api is a transitive dep of @sorowill/sdk
    const { isConnected, getNetwork: getFreighterNetwork } = await import(
      '@stellar/freighter-api'
    );
    const connected = await isConnected();
    if (!connected.isConnected) {
      return null;
    }
    const net = await getFreighterNetwork();
    if (net.error) {
      return null;
    }
    return { network: net.network, networkPassphrase: net.networkPassphrase };
  } catch {
    return null;
  }
}

/**
 * Truncates a Stellar address for display, e.g. `GABC...WXYZ`.
 *
 * This helper is Stellar-address-specific: real callers only ever pass a
 * Stellar public key, which is always exactly 56 characters (`G` followed by
 * 55 base32 characters). The `length <= 12` short-circuit below is therefore a
 * defensive no-op for hypothetical non-Stellar input — it is unreachable for
 * real Stellar addresses, but kept so the function degrades gracefully rather
 * than producing a nonsensical `slice` result for short strings.
 */
export function truncateAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
