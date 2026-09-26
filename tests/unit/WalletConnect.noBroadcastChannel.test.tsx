import { fireEvent, render, screen } from '@testing-library/react';
import { WalletConnect } from '@/components/WalletConnect';

vi.mock('@/lib/freighter', () => ({
  safeGetPublicKey: vi.fn().mockResolvedValue(null),
  safeConnectWallet: vi.fn().mockResolvedValue({
    publicKey: 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4',
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
  }),
  truncateAddress: (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`,
}));

describe('WalletConnect without BroadcastChannel (#324)', () => {
  beforeEach(() => {
    vi.stubGlobal('BroadcastChannel', undefined);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders, connects and disconnects in single-tab mode', async () => {
    render(<WalletConnect />);

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));
    expect(await screen.findByText('GDBR…4JL4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
  });
});
