import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  SESSION_CHECK_INTERVAL_MS,
  SESSION_EXPIRED_MESSAGE,
  SESSION_MAX_AGE_MS,
  WalletConnect,
  isSessionExpired,
} from '@/components/WalletConnect';
import { safeGetPublicKey } from '@/lib/freighter';

const KEY = 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4';

vi.mock('@/lib/freighter', () => ({
  safeGetPublicKey: vi.fn(),
  safeConnectWallet: vi.fn(async () => ({
    publicKey: 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4',
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
  })),
  truncateAddress: (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`,
}));

const mockGetPublicKey = vi.mocked(safeGetPublicKey);

async function connect() {
  render(<WalletConnect />);
  await act(async () => {});
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));
  });
  expect(screen.getByText('GDBR…4JL4')).toBeInTheDocument();
}

describe('WalletConnect session expiry (#407)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', undefined);
    sessionStorage.clear();
    mockGetPublicKey.mockReset();
    mockGetPublicKey.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('isSessionExpired respects the max age', () => {
    expect(isSessionExpired(null)).toBe(false);
    expect(isSessionExpired(0, SESSION_MAX_AGE_MS - 1)).toBe(false);
    expect(isSessionExpired(0, SESSION_MAX_AGE_MS)).toBe(true);
  });

  it('expires the session once it outlives the max age, then allows re-login', async () => {
    await connect();
    mockGetPublicKey.mockResolvedValue(KEY);

    await act(async () => {
      vi.advanceTimersByTime(SESSION_MAX_AGE_MS);
    });

    expect(screen.getByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText('GDBR…4JL4')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));
    });
    expect(screen.getByText('GDBR…4JL4')).toBeInTheDocument();
    expect(screen.queryByText(SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
  });

  it('expires the session when the wallet stops reporting the connected account', async () => {
    await connect();
    mockGetPublicKey.mockResolvedValue(null);

    await act(async () => {
      vi.advanceTimersByTime(SESSION_CHECK_INTERVAL_MS);
    });

    expect(screen.getByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
  });
});
