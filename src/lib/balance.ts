import { getNetwork } from './sorowill';

const FETCH_TIMEOUT_MS = 10_000;

interface HorizonBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

function getUsdcIssuer(network: string): string {
  const envKey = `NEXT_PUBLIC_USDC_ISSUER_${network.toUpperCase()}`;
  const issuer = process.env[envKey];
  if (!issuer) {
    throw new Error(
      `USDC issuer not configured for ${network}. ` +
        `Set ${envKey} env var.`,
    );
  }
  return issuer;
}

export async function getUserBalance(userAddress: string): Promise<string | null> {
  try {
    const network = getNetwork();
    const horizonUrl =
      network === 'mainnet'
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org';

    const response = await fetch(`${horizonUrl}/accounts/${userAddress}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { balances?: HorizonBalance[] };
    const balances = data.balances || [];

    const expectedIssuer = getUsdcIssuer(network);
    const usdcBalance = balances.find(
      (b) =>
        b.asset_code === 'USDC' &&
        (!expectedIssuer || b.asset_issuer === expectedIssuer),
    );
    return usdcBalance ? usdcBalance.balance : null;
  } catch {
    return null;
  }
}
