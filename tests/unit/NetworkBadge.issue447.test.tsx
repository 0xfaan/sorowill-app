/**
 * Regression test for #447.
 *
 * NetworkBadge must surface a "degraded" RPC health state in its rendered
 * `data-rpc-status` attribute and title text — not just "connected" or
 * "offline" — so a slow/rate-limited RPC is visibly distinguished from a
 * healthy one in the UI.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NetworkBadge } from '@/components/NetworkBadge';

function mockFetch(impl: () => Promise<Partial<Response>>) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NetworkBadge — degraded RPC health (#447)', () => {
  it('surfaces a degraded status (not connected) when the RPC rate-limits', async () => {
    mockFetch(async () => ({ ok: false, status: 429 }));
    render(<NetworkBadge />);
    const badge = screen.getByLabelText(/current network/i);
    await waitFor(() => expect(badge).toHaveAttribute('data-rpc-status', 'degraded'));
    expect(badge.getAttribute('data-rpc-status')).not.toBe('connected');
    expect(badge.getAttribute('title')).toMatch(/degraded/i);
  });

  it('surfaces an offline status distinct from degraded when the RPC returns a server error', async () => {
    mockFetch(async () => ({ ok: false, status: 503 }));
    render(<NetworkBadge />);
    const badge = screen.getByLabelText(/current network/i);
    await waitFor(() => expect(badge).toHaveAttribute('data-rpc-status', 'offline'));
    expect(badge.getAttribute('data-rpc-status')).not.toBe('degraded');
    expect(badge.getAttribute('title')).toMatch(/offline/i);
  });
});
