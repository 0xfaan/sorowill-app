import { act, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import InheritPageClient from '../../src/app/inherit/[id]/InheritPageClient';

const getWill = vi.fn();

vi.mock('@/lib/sorowill', () => ({
  getSoroWillClient: () => ({ getWill }),
  stellarExpertUrl: () => '#',
}));

vi.mock('@/lib/freighter', () => ({
  safeGetPublicKey: vi.fn().mockResolvedValue(null),
  truncateAddress: (value: string) => value,
}));

vi.mock('@/components/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

describe('InheritPageClient will fetching', () => {
  beforeEach(() => {
    getWill.mockReset();
  });

  it('sends only one getWill request on mount, even under StrictMode double-invoke', async () => {
    let resolve!: (value: unknown) => void;
    getWill.mockReturnValue(new Promise((r) => (resolve = r)));

    render(
      <StrictMode>
        <InheritPageClient id="1" />
      </StrictMode>,
    );

    expect(getWill).toHaveBeenCalledTimes(1);
    expect(getWill).toHaveBeenCalledWith('1');

    await act(async () => {
      resolve(null);
    });
  });

  it('cancels the in-flight request on unmount so its result is ignored', async () => {
    let resolve!: (value: unknown) => void;
    getWill.mockReturnValue(new Promise((r) => (resolve = r)));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(<InheritPageClient id="2" />);
    expect(getWill).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      resolve({ id: '2', balance: '0', beneficiaries: [] });
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not hit the RPC for an invalid will ID', () => {
    render(<InheritPageClient id="abc" />);
    expect(getWill).not.toHaveBeenCalled();
  });
});
