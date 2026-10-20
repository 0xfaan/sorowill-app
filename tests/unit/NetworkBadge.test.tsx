import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NetworkBadge, checkRpcHealth } from '@/components/NetworkBadge';

function mockFetch(impl: () => Promise<Partial<Response>>) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NetworkBadge', () => {
  it('renders network badge with current network', async () => {
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ result: {} }) }));
    render(<NetworkBadge />);
    const badge = screen.getByLabelText(/current network/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/testnet|mainnet/i);
    await waitFor(() => expect(badge).toHaveAttribute('data-rpc-status', 'connected'));
    expect(badge.getAttribute('title')).toMatch(/connected \(\d+ms\)/);
  });

  it('shows offline status when the RPC is unreachable', async () => {
    mockFetch(async () => {
      throw new Error('Failed to fetch');
    });
    render(<NetworkBadge />);
    const badge = screen.getByLabelText(/current network/i);
    await waitFor(() => expect(badge).toHaveAttribute('data-rpc-status', 'offline'));
    expect(badge.getAttribute('title')).toContain('Failed to fetch');
  });
});

describe('checkRpcHealth', () => {
  it('uses the lightweight getNetwork method', async () => {
    const fetchFn = mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ result: {} }) }));
    await checkRpcHealth('https://rpc.example');
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).method).toBe('getNetwork');
  });

  it('reports degraded on rate limiting or JSON-RPC errors', async () => {
    mockFetch(async () => ({ ok: false, status: 429 }));
    expect((await checkRpcHealth('https://rpc.example')).status).toBe('degraded');
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ error: { message: 'boom' } }) }));
    expect(await checkRpcHealth('https://rpc.example')).toMatchObject({ status: 'degraded', error: 'boom' });
  });

  it('reports offline on HTTP errors', async () => {
    mockFetch(async () => ({ ok: false, status: 503 }));
    expect(await checkRpcHealth('https://rpc.example')).toMatchObject({ status: 'offline', error: 'HTTP 503' });
  });
});
