/**
 * Tests for issue #337:
 * GET /api/reminders/confirm must return a human-readable HTML page,
 * not a raw JSON blob containing the subscription object and token.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @/lib/reminders before importing the route handler
// ---------------------------------------------------------------------------
vi.mock('@/lib/reminders', () => ({
  confirmReminderSubscription: vi.fn(),
}));

import { confirmReminderSubscription } from '@/lib/reminders';
import { GET } from '@/app/api/reminders/confirm/route';

const mockConfirm = vi.mocked(confirmReminderSubscription);

beforeEach(() => {
  mockConfirm.mockReset();
});

// ---------------------------------------------------------------------------
// Helper: build a minimal Request for the confirm endpoint
// ---------------------------------------------------------------------------
function makeRequest(token: string): Request {
  return new Request(`https://app.example.com/api/reminders/confirm?token=${encodeURIComponent(token)}`);
}

describe('#337 — GET /api/reminders/confirm returns HTML, not JSON', () => {
  it('returns 200 with HTML content-type on successful confirmation', async () => {
    mockConfirm.mockResolvedValue({ ok: true });

    const response = await GET(makeRequest('valid-token'));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/html/);
    expect(body).toMatch(/<html/i);
    expect(body).toContain('confirmed');
  });

  it('returns 400 with HTML content-type on invalid token', async () => {
    mockConfirm.mockResolvedValue({ ok: false, error: 'Token not found' });

    const response = await GET(makeRequest('bad-token'));
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toMatch(/text\/html/);
    expect(body).toMatch(/<html/i);
  });

  it('does NOT echo the subscription object or confirmation token in the body', async () => {
    const sensitiveToken = 'super-secret-confirmation-token-xyz';
    const sensitiveEmail = 'user@private.example.com';

    mockConfirm.mockResolvedValue({
      ok: true,
      // These fields exist on the real result but must not be surfaced in the response.
      subscription: {
        email: sensitiveEmail,
        confirmationToken: sensitiveToken,
        willId: 'will-123',
        confirmed: false,
        createdAt: new Date().toISOString(),
      },
    } as never);

    const response = await GET(makeRequest(sensitiveToken));
    const body = await response.text();

    expect(body).not.toContain(sensitiveToken);
    expect(body).not.toContain(sensitiveEmail);
    // Must not be JSON
    expect(() => JSON.parse(body)).toThrow();
  });

  it('passes the token query parameter to confirmReminderSubscription', async () => {
    mockConfirm.mockResolvedValue({ ok: true });

    await GET(makeRequest('my-token-abc'));

    expect(mockConfirm).toHaveBeenCalledWith('my-token-abc');
  });

  it('uses empty string when no token is present in the query', async () => {
    mockConfirm.mockResolvedValue({ ok: false, error: 'Invalid token' });

    const response = await GET(
      new Request('https://app.example.com/api/reminders/confirm'),
    );

    expect(mockConfirm).toHaveBeenCalledWith('');
    expect(response.status).toBe(400);
  });
});
