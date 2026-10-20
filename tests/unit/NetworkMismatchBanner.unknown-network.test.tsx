import { render, screen } from '@testing-library/react';
import { NetworkMismatchBanner } from '@/components/NetworkMismatchBanner';
import { safeGetWalletNetwork } from '@/lib/freighter';

vi.mock('@/lib/freighter', () => ({
  safeGetPublicKey: vi.fn().mockResolvedValue('GABC'),
  safeGetWalletNetwork: vi.fn(),
}));

vi.mock('@/lib/sorowill', () => ({
  getNetwork: vi.fn(() => 'testnet'),
}));

describe('NetworkMismatchBanner with a wallet on an unrecognised network (#322)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it.each(['FUTURENET', 'STANDALONE', 'SOMETHING_ELSE'])('warns and names the wallet network when it is %s', async (network) => {
    vi.mocked(safeGetWalletNetwork).mockResolvedValue({ network, networkPassphrase: '' });

    render(<NetworkMismatchBanner />);

    const banner = await screen.findByTestId('network-mismatch-banner');
    expect(banner).toHaveTextContent(network);
    expect(banner).toHaveTextContent('testnet');
  });
});
