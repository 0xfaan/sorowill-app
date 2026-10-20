/**
 * Tests for issue #399:
 * POST /api/reminders/register must rate-limit per client IP and send Retry-After.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/reminders', () => ({
  registerReminderSubscription: vi.fn(async () => ({ ok: true })),
}));
vi.mock('@/lib/sorowill', () => ({
  getSoroWillClient: () => ({ getWill: vi.fn(async () => ({ id: 'w1' })) }),
}));
vi.mock('viem', () => ({ verifyMessage: vi.fn(async () => true) }));

import { POST } from '@/app/api/reminders/register/route';
import { checkRateLimit, resetRateLimits } from '@/lib/rate-limit';

function makeRequest(ip: string, email = 'a@example.com'): Request {
  return new Request('https://app.example.com/api/reminders/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `${ip}, 10.0.0.1` },
    body: JSON.stringify({ willId: 'w1', email, owner: '0xabc', signature: '0xsig', message: 'm' }),
  });
}

beforeEach(() => {
  resetRateLimits();
});

describe('#399 — IP rate limiting on reminder registration', () => {
  it('blocks bulk registrations from the same IP after 10 per hour with Retry-After', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest('203.0.113.7', `user${i}@example.com`));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(makeRequest('203.0.113.7', 'user11@example.com'));
    expect(blocked.status).toBe(429);
    const retryAfter = Number(blocked.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(3600);
  });

  it('does not affect requests from a different IP', async () => {
    for (let i = 0; i < 11; i++) await POST(makeRequest('203.0.113.7'));
    const res = await POST(makeRequest('198.51.100.2'));
    expect(res.status).toBe(200);
  });

  it('resets the window after it expires', () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) expect(checkRateLimit('k', 10, 1000, now).allowed).toBe(true);
    expect(checkRateLimit('k', 10, 1000, now).allowed).toBe(false);
    expect(checkRateLimit('k', 10, 1000, now + 1000).allowed).toBe(true);
  });
});
