/**
 * Issue #398: reminder routes that parse a request body must reject
 * non-JSON Content-Types with 415 instead of parsing JSON sent as text/plain.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/reminders', () => ({
  registerReminderSubscription: vi.fn(),
  unsubscribeReminderSubscription: vi.fn(),
}));
vi.mock('@/lib/sorowill', () => ({ getSoroWillClient: vi.fn() }));

import { rejectUnsupportedContentType } from '@/lib/contentType';
import { registerReminderSubscription, unsubscribeReminderSubscription } from '@/lib/reminders';
import { POST as registerPost } from '@/app/api/reminders/register/route';
import { POST as unsubscribePost } from '@/app/api/reminders/unsubscribe/route';

function post(path: string, contentType: string | null, body: string): Request {
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;
  return new Request(`https://app.example.com${path}`, { method: 'POST', headers, body });
}

const jsonBody = JSON.stringify({ willId: '1', email: 'a@b.c', owner: 'x', signature: 'y', message: 'z', token: 't' });

describe('#398 — rejectUnsupportedContentType', () => {
  it('allows application/json with parameters, case-insensitively', () => {
    expect(rejectUnsupportedContentType(post('/', 'Application/JSON; charset=utf-8', '{}'))).toBeNull();
  });

  it.each(['text/plain', 'multipart/form-data; boundary=x', 'application/json-evil', null])(
    'rejects %s with 415',
    async (ct) => {
      const res = rejectUnsupportedContentType(post('/', ct, '{}'));
      expect(res?.status).toBe(415);
      expect(res?.headers.get('accept-post')).toBe('application/json');
    },
  );
});

describe('#398 — reminder routes reject non-JSON bodies', () => {
  it('POST /api/reminders/register returns 415 for text/plain JSON', async () => {
    const res = await registerPost(post('/api/reminders/register', 'text/plain', jsonBody));
    expect(res.status).toBe(415);
    expect(registerReminderSubscription).not.toHaveBeenCalled();
  });

  it('POST /api/reminders/unsubscribe returns 415 for text/plain JSON', async () => {
    const res = await unsubscribePost(post('/api/reminders/unsubscribe', 'text/plain', jsonBody));
    expect(res.status).toBe(415);
    expect(unsubscribeReminderSubscription).not.toHaveBeenCalled();
  });

  it('POST /api/reminders/unsubscribe still accepts RFC 8058 form posts', async () => {
    vi.mocked(unsubscribeReminderSubscription).mockResolvedValue({ ok: true });
    const res = await unsubscribePost(
      post('/api/reminders/unsubscribe?token=t', 'application/x-www-form-urlencoded', 'List-Unsubscribe=One-Click'),
    );
    expect(res.status).toBe(200);
  });
});
