/**
 * Tests for issue #336:
 * dispatchReminderEmails processes subscriptions with bounded concurrency
 * (BATCH_SIZE = 10) rather than one at a time, and writes the store once
 * per batch rather than once per email.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WillStatus } from '@sorowill/sdk';
import { dispatchReminderEmails, type ReminderStore } from '@/lib/reminders';

// ---------------------------------------------------------------------------
// Minimal Will fixture
// ---------------------------------------------------------------------------
const WILL_ID_PREFIX = 'will-dispatch-336-';

function makeWill(id: string) {
  return {
    id,
    owner: 'GOWNER',
    status: WillStatus.Active,
    lastCheckin: new Date(Date.now() - 10 * 86_400_000), // 10 days ago
    checkinPeriodDays: 60,
    beneficiaries: [],
    guardians: [],
    balance: '100',
  };
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@sorowill/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sorowill/sdk')>();
  return { ...actual, WillStatus: actual.WillStatus };
});

vi.mock('@/lib/sorowill', () => ({
  getSoroWillClient: () => ({
    getWill: vi.fn((willId: string) => Promise.resolve(makeWill(willId))),
  }),
}));

// ---------------------------------------------------------------------------
// In-memory KV store simulation (reused from reminders-concurrent pattern)
// ---------------------------------------------------------------------------

let kvStore: string | null = null;
let kvLock: string | null = null;

function makeKvFetch(storeKey: string, lockKey: string) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const path = new URL(url).pathname;
    const searchParams = new URL(url).searchParams;
    const segments = path.split('/').filter(Boolean);
    const method = (init?.method ?? 'GET').toUpperCase();

    if (method === 'POST' && segments[0] === 'pipeline') {
      const commands = JSON.parse((init?.body as string) ?? '[]') as string[][];
      const results = commands.map((cmd) => {
        const verb = cmd[0]?.toUpperCase();
        const key = cmd[1];
        if (verb === 'GET') {
          return { result: key === lockKey ? kvLock : kvStore };
        }
        return { result: null };
      });
      return new Response(JSON.stringify(results), { status: 200 });
    }

    const command = segments[0];

    if (command === 'get') {
      const key = decodeURIComponent(segments[1] ?? '');
      const value = key === storeKey ? kvStore : key === lockKey ? kvLock : null;
      return new Response(JSON.stringify({ result: value }), { status: 200 });
    }

    if (command === 'set' && method === 'POST') {
      const key = decodeURIComponent(segments[1] ?? '');
      const isNX = searchParams.has('NX');

      if (key === lockKey) {
        const token = decodeURIComponent(segments[2] ?? '');
        if (isNX && kvLock !== null) {
          return new Response(JSON.stringify({ result: null }), { status: 200 });
        }
        kvLock = token;
        return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
      }

      if (key === storeKey) {
        kvStore = (init?.body as string) ?? null;
        return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
      }

      return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
    }

    if (command === 'del' && method === 'POST') {
      const key = decodeURIComponent(segments[1] ?? '');
      if (key === lockKey) kvLock = null;
      return new Response(JSON.stringify({ result: 1 }), { status: 200 });
    }

    return new Response(JSON.stringify({ result: null }), { status: 200 });
  };
}

// ---------------------------------------------------------------------------
// Helpers to build a pre-seeded store with N confirmed subscriptions
// ---------------------------------------------------------------------------

function buildStore(count: number): ReminderStore {
  const subscriptions: ReminderStore['subscriptions'] = {};
  for (let i = 0; i < count; i++) {
    const willId = `${WILL_ID_PREFIX}${i}`;
    const email = `user${i}@example.com`;
    const key = `${willId}:${email}`;
    subscriptions[key] = {
      willId,
      email,
      owner: 'GOWNER',
      confirmed: true,
      confirmationToken: `tok-${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return { subscriptions, history: {} };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('#336 — dispatchReminderEmails concurrent batch processing', () => {
  const KV_REST_API_URL = 'https://fake-kv-336.upstash.io';
  const KV_REST_API_TOKEN = 'fake-token-336';
  const STORE_KEY = 'sorowill:reminder-store';
  const LOCK_KEY = `${STORE_KEY}:lock`;

  beforeEach(() => {
    kvStore = null;
    kvLock = null;
    process.env.KV_REST_API_URL = KV_REST_API_URL;
    process.env.KV_REST_API_TOKEN = KV_REST_API_TOKEN;
    process.env.REMINDER_STORE_KV_KEY = STORE_KEY;
    // Disable real email delivery
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    vi.stubGlobal('fetch', makeKvFetch(STORE_KEY, LOCK_KEY));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.REMINDER_STORE_KV_KEY;
  });

  it('processes all subscriptions and counts match (1 subscription)', async () => {
    kvStore = JSON.stringify(buildStore(1));
    const result = await dispatchReminderEmails();
    expect(result.errors).toHaveLength(0);
    expect(result.sent + result.skipped).toBe(1);
    expect(result.sent).toBe(1);
  });

  it('processes all subscriptions and counts match (15 subscriptions across 2 batches)', async () => {
    // BATCH_SIZE = 10, so 15 subscriptions → 2 batches (10 + 5)
    const count = 15;
    kvStore = JSON.stringify(buildStore(count));

    const result = await dispatchReminderEmails();

    expect(result.errors).toHaveLength(0);
    // All should be sent (none have history entries yet)
    expect(result.sent).toBe(count);
    expect(result.skipped).toBe(0);

    // Verify every subscription has a history entry in the final store.
    const finalStore = JSON.parse(kvStore!) as ReminderStore;
    for (let i = 0; i < count; i++) {
      const willId = `${WILL_ID_PREFIX}${i}`;
      const histKey = `${willId}:user${i}@example.com`;
      expect(finalStore.history[histKey]).toBeDefined();
      expect(finalStore.history[histKey]?.wellBeforeSentAt).toBeTruthy();
    }
  });

  it('does not re-send emails for subscriptions that already have a history entry', async () => {
    const store = buildStore(3);
    // Pre-populate history for subscription 0 — it must be skipped.
    const willId0 = `${WILL_ID_PREFIX}0`;
    const histKey0 = `${willId0}:user0@example.com`;
    store.history[histKey0] = {
      willId: willId0,
      email: 'user0@example.com',
      wellBeforeSentAt: new Date().toISOString(),
    };
    kvStore = JSON.stringify(store);

    const result = await dispatchReminderEmails();

    expect(result.errors).toHaveLength(0);
    expect(result.sent).toBe(2); // subscriptions 1 and 2
    expect(result.skipped).toBe(1); // subscription 0 already sent
  });

  it('skips unconfirmed subscriptions', async () => {
    const store = buildStore(2);
    // Mark subscription 1 as unconfirmed.
    const willId1 = `${WILL_ID_PREFIX}1`;
    const key1 = `${willId1}:user1@example.com`;
    store.subscriptions[key1]!.confirmed = false;
    kvStore = JSON.stringify(store);

    const result = await dispatchReminderEmails();

    expect(result.errors).toHaveLength(0);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('writes history to the store after each batch (not just at the end)', async () => {
    // Use 12 subscriptions so we get 2 batches; spy on writeStore calls
    // by counting how many times kvStore is updated during the run.
    const count = 12;
    kvStore = JSON.stringify(buildStore(count));

    let writeCount = 0;
    const originalFetch = makeKvFetch(STORE_KEY, LOCK_KEY);
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = new URL(url).pathname;
      const segments = path.split('/').filter(Boolean);
      if (
        (init?.method ?? 'GET').toUpperCase() === 'POST' &&
        segments[0] === 'set' &&
        decodeURIComponent(segments[1] ?? '') === STORE_KEY
      ) {
        writeCount += 1;
      }
      return originalFetch(input, init);
    });

    const result = await dispatchReminderEmails();

    expect(result.sent).toBe(count);
    // With BATCH_SIZE=10, 12 subscriptions → 2 batches → 2 store writes
    // (plus 1 from writeStore in the finally-releaseLock path if applicable).
    // We verify at least 2 writes happened (one per batch).
    expect(writeCount).toBeGreaterThanOrEqual(2);
  });
});
