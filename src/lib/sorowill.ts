import { SoroWillClient, type SoroWillNetwork, type Will } from '@sorowill/sdk';

function validateStellarNetwork(value: string): SoroWillNetwork {
  if (value !== 'testnet' && value !== 'mainnet') {
    throw new Error(
      `Invalid NEXT_PUBLIC_STELLAR_NETWORK: "${value}". Must be exactly 'testnet' or 'mainnet'.`,
    );
  }
  return value;
}

function validateContractId(value: string): void {
  if (!/^C[A-Z2-7]{55}$/.test(value)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_CONTRACT_ID: "${value}". Must be a valid Stellar contract address (starts with 'C' followed by 55 base32 characters).`,
    );
  }
}

function validateRpcUrl(value: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_RPC_URL: "${value}". Must be a valid URL.`,
    );
  }
}

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value) {
    if (fallback !== undefined) return fallback;
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

let cachedClient: SoroWillClient | undefined;
let cachedNetwork: SoroWillNetwork | undefined;

export function resetSoroWillClient(): void {
  cachedClient = undefined;
  cachedNetwork = undefined;
}

/** The Stellar network configured for this deployment. */
export function getNetwork(): SoroWillNetwork {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('sorowill_network');
    if (stored === 'testnet' || stored === 'mainnet') {
      return stored as SoroWillNetwork;
    }
  }
  const value = readEnv('NEXT_PUBLIC_STELLAR_NETWORK', 'testnet');
  return validateStellarNetwork(value);
}

/** The deployed SoroWill contract address configured for this deployment. */
export function getContractId(): string {
  const network = getNetwork();
  let contractId: string;
  if (network === 'mainnet') {
    contractId = process.env.NEXT_PUBLIC_CONTRACT_ID_MAINNET || process.env.NEXT_PUBLIC_CONTRACT_ID || '';
  } else {
    contractId = process.env.NEXT_PUBLIC_CONTRACT_ID_TESTNET || process.env.NEXT_PUBLIC_CONTRACT_ID || '';
  }
  if (!contractId) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_CONTRACT_ID (or NEXT_PUBLIC_CONTRACT_ID_MAINNET/NEXT_PUBLIC_CONTRACT_ID_TESTNET). Copy .env.example to .env.local and fill it in.',
    );
  }
  validateContractId(contractId);
  return contractId;
}

/** The Soroban RPC URL configured for this deployment, for display/linking purposes. */
export function getRpcUrl(): string {
  const network = getNetwork();
  let rpcUrl: string;
  if (network === 'mainnet') {
    rpcUrl = process.env.NEXT_PUBLIC_RPC_URL_MAINNET || 'https://soroban-mainnet.stellar.org';
  } else {
    rpcUrl = process.env.NEXT_PUBLIC_RPC_URL_TESTNET || process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
  }
  validateRpcUrl(rpcUrl);
  return rpcUrl;
}

/**
 * Returns a lazily-initialized, module-level singleton `SoroWillClient`
 * configured from the active network.
 */
export function getSoroWillClient(): SoroWillClient {
  const network = getNetwork();
  const contractId = getContractId();
  if (!cachedClient || cachedNetwork !== network) {
    cachedClient = new SoroWillClient({ network, contractId });
    cachedNetwork = network;
  }
  return cachedClient;
}

/** Base URL for viewing addresses/contracts/transactions on Stellar Expert. */
export function stellarExpertUrl(kind: 'contract' | 'account' | 'tx', id: string): string {
  const network = getNetwork();
  return `https://stellar.expert/explorer/${network}/${kind}/${id}`;
}

/** Result of scanning for wills where the given address is a guardian. */
export interface GetWillsByGuardianResult {
  wills: Will[];
  hasErrors: boolean;
}

/** Fetches wills by guardian by scanning sequential will IDs. */
export async function getWillsByGuardian(
  guardianAddress: string,
): Promise<GetWillsByGuardianResult> {
  const client = getSoroWillClient();
  const wills: Will[] = [];
  const promises = [];
  let hasErrors = false;
  // Scan sequentially up to 30 wills, which covers the test environment range.
  for (let i = 1; i <= 30; i++) {
    promises.push(
      client
        .getWill(i.toString())
        .then((will) => {
          if (will && will.guardians && will.guardians.includes(guardianAddress)) {
            wills.push(will);
          }
        })
        .catch((err) => {
          // A "not found" style error for a nonexistent will id is expected;
          // anything else indicates a real fetch failure worth surfacing.
          if (!(err instanceof Error) || !/not found/i.test(err.message)) {
            hasErrors = true;
          }
        })
    );
  }
  await Promise.all(promises);
  return { wills, hasErrors };
}


