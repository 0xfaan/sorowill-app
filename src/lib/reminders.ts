import { WillStatus, type Will } from '@sorowill/sdk';

import { nextCheckinDeadline } from '@/lib/deadlines';
import { getSoroWillClient } from '@/lib/sorowill';

export type ReminderKind = 'well-before' | 'imminent';

export interface ReminderSubscription {
  willId: string;
  email: string;
  owner: string;
  confirmed: boolean;
  confirmationToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderHistoryEntry {
  willId: string;
  email: string;
  wellBeforeSentAt?: string;
  imminentSentAt?: string;
}

export interface ReminderStore {
  subscriptions: Record<string, ReminderSubscription>;
  history: Record<string, ReminderHistoryEntry>;
}

export interface ReminderRegistrationResult {
  ok: boolean;
  subscription?: ReminderSubscription;
  error?: string;
}

export interface ReminderDispatchResult {
  sent: number;
  skipped: number;
  errors: string[];
}

// Reminder subscriptions/history are persisted to a Vercel KV / Upstash Redis
// REST endpoint so they survive across serverless invocations (the local
// filesystem is ephemeral per-invocation on Vercel and cannot be relied on).
// See .env.example for KV_REST_API_URL / KV_REST_API_TOKEN.
//
// NOTE: All env vars are read at call time (inside helper functions) rather
// than at module-load time, so that tests can set process.env before calling
// any of the exported functions.

const KV_LOCK_TTL_SECONDS = 30;
/** How long to wait between retry attempts when the lock is held. */
const KV_LOCK_RETRY_DELAY_MS = 100;
/** Maximum number of acquire retries before giving up. */
const KV_LOCK_MAX_RETRIES = 20;
/** Renew the lock when remaining TTL drops below this threshold (seconds). */
const KV_LOCK_RENEW_THRESHOLD_SECONDS = 10;

function kvConfig(): { url: string; token: string; storeKey: string; lockKey: string } {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const storeKey = process.env.REMINDER_STORE_KV_KEY || 'sorowill:reminder-store';
  if (!url || !token) {
    throw new Error(
      'Reminder storage is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN ' +
        '(a Vercel KV / Upstash Redis REST endpoint) so reminder subscriptions persist ' +
        'across serverless invocations. See .env.example.',
    );
  }
  return { url, token, storeKey, lockKey: `${storeKey}:lock` };
}

function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getReminderKind(daysRemaining: number): ReminderKind {
  return daysRemaining <= 14 ? 'imminent' : 'well-before';
}

// ---------------------------------------------------------------------------
// Distributed lock helpers (Upstash REST SET NX / DEL)
// ---------------------------------------------------------------------------

/**
 * Attempt to acquire a distributed lock.
 * Uses SET <key> <token> EX <ttl> NX via the Upstash REST API.
 * Returns the lock token on success, or null if the lock is already held.
 */
async function tryAcquireLock(token: string): Promise<boolean> {
  // Upstash REST: POST /set/<key>/<value>?EX=<ttl>&NX=
  const { url: baseUrl, token: kvToken, lockKey } = kvConfig();
  const url = new URL(
    `/set/${encodeURIComponent(lockKey)}/${encodeURIComponent(token)}`,
    baseUrl,
  );
  url.searchParams.set('EX', String(KV_LOCK_TTL_SECONDS));
  url.searchParams.set('NX', '');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!response.ok) {
    throw new Error(`Lock acquire request failed: ${response.status}`);
  }
  const body = (await response.json()) as { result: string | null };
  // Upstash returns {"result":"OK"} on success or {"result":null} when key exists.
  return body.result === 'OK';
}

/**
 * Release the distributed lock atomically using an Upstash EVAL Lua script.
 * Only deletes the key when the stored value matches our token (compare-and-delete).
 * This avoids the non-atomic GET-then-DEL race where the lock could be acquired
 * by another process after our GET but before our DEL.
 */
async function releaseLock(token: string): Promise<void> {
  const { url: baseUrl, token: kvToken, lockKey } = kvConfig();
  const script = `
    local current = redis.call('GET', KEYS[1])
    if current == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    end
    return 0
  `;
  const response = await fetch(`${baseUrl}/eval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script,
      keys: [lockKey],
      arguments: [token],
    }),
  });
  if (!response.ok) {
    console.warn(`[reminders] Lock release EVAL failed: ${response.status}`);
  }
}

/**
 * Acquire the distributed lock, retrying up to KV_LOCK_MAX_RETRIES times with
 * a short delay between attempts. Throws if the lock cannot be obtained in time.
 * Returns the token to be passed to releaseLock().
 */
async function acquireLock(): Promise<string> {
  // kvConfig() will throw if the env vars are not set — that surfaces the error
  // clearly before we attempt any network calls.
  kvConfig();
  const token = crypto.randomUUID();
  for (let attempt = 0; attempt <= KV_LOCK_MAX_RETRIES; attempt++) {
    if (await tryAcquireLock(token)) {
      return token;
    }
    // Wait before retrying.
    await new Promise<void>((resolve) => setTimeout(resolve, KV_LOCK_RETRY_DELAY_MS));
  }
  throw new Error(
    `[reminders] Could not acquire store lock after ${KV_LOCK_MAX_RETRIES} retries. ` +
      'Another process may be holding it or the lock TTL has not yet expired.',
  );
}

/**
 * Renew the distributed lock TTL if it is close to expiring.
 * Uses Upstash REST EXPIRE to extend the lock by another KV_LOCK_TTL_SECONDS.
 * Returns true if the lock was renewed or still has plenty of time left.
 */
async function renewLock(lockKey: string): Promise<boolean> {
  const { url: baseUrl, token: kvToken } = kvConfig();
  const response = await fetch(`${baseUrl}/expire/${encodeURIComponent(lockKey)}/${KV_LOCK_TTL_SECONDS}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!response.ok) {
    return false;
  }
  const body = (await response.json()) as { result: number | null };
  return body.result === 1;
}

// ---------------------------------------------------------------------------
// Store read / write
// ---------------------------------------------------------------------------

async function readStore(): Promise<ReminderStore> {
  const { url, token, storeKey } = kvConfig();
  const response = await fetch(`${url}/get/${encodeURIComponent(storeKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to read reminder store: ${response.status}`);
  }
  const payload = (await response.json()) as { result: string | null };
  if (!payload.result) {
    return { subscriptions: {}, history: {} };
  }
  const parsed = JSON.parse(payload.result) as Partial<ReminderStore>;
  return {
    subscriptions: parsed.subscriptions ?? {},
    history: parsed.history ?? {},
  };
}

async function writeStore(store: ReminderStore): Promise<void> {
  const { url, token, storeKey } = kvConfig();
  const response = await fetch(`${url}/set/${encodeURIComponent(storeKey)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(store),
  });
  if (!response.ok) {
    throw new Error(`Failed to write reminder store: ${response.status}`);
  }
}

function getHistoryKey(willId: string, email: string): string {
  return `${willId}:${normalizeEmail(email)}`;
}

export async function registerReminderSubscription({
  willId,
  email,
  owner,
  appUrl,
}: {
  willId: string;
  email: string;
  owner: string;
  appUrl: string;
}): Promise<ReminderRegistrationResult> {
  if (!willId.trim()) {
    return { ok: false, error: 'A willId is required.' };
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please provide a valid email address.' };
  }

  try {
    await getSoroWillClient().getWill(willId);
  } catch {
    return { ok: false, error: 'No will exists with the provided willId.' };
  }

  const lockToken = await acquireLock();
  try {
    const store = await readStore();
    const key = `${willId}:${normalizedEmail}`;
    const existing = store.subscriptions[key];

    if (existing) {
      if (existing.confirmed) {
        return { ok: true, subscription: existing };
      }
    }

    const subscription: ReminderSubscription = {
      willId,
      email: normalizedEmail,
      owner,
      confirmed: false,
      confirmationToken: crypto.randomUUID(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.subscriptions[key] = subscription;
    await writeStore(store);

    await sendConfirmationEmail({ to: subscription.email, appUrl, token: subscription.confirmationToken });

    return { ok: true, subscription };
  } finally {
    await releaseLock(lockToken);
  }
}

export async function confirmReminderSubscription(token: string): Promise<ReminderRegistrationResult> {
  const lockToken = await acquireLock();
  try {
    const store = await readStore();
    const subscription = Object.values(store.subscriptions).find((entry) => entry.confirmationToken === token);
    if (!subscription) {
      return { ok: false, error: 'Invalid or expired confirmation token.' };
    }

    subscription.confirmed = true;
    subscription.updatedAt = new Date().toISOString();
    store.subscriptions[`${subscription.willId}:${subscription.email}`] = subscription;
    await writeStore(store);

    return { ok: true, subscription };
  } finally {
    await releaseLock(lockToken);
  }
}

export async function unsubscribeReminderSubscription({
  willId,
  email,
}: {
  willId: string;
  email: string;
}): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = normalizeEmail(email);
  const key = `${willId}:${normalizedEmail}`;

  const lockToken = await acquireLock();
  try {
    const store = await readStore();
    if (!store.subscriptions[key]) {
      return { ok: false, error: 'No matching reminder subscription was found.' };
    }

    delete store.subscriptions[key];
    await writeStore(store);

    return { ok: true };
  } finally {
    await releaseLock(lockToken);
  }
}

export async function dispatchReminderEmails(): Promise<ReminderDispatchResult> {
  const lockToken = await acquireLock();
  const { lockKey, storeKey } = kvConfig();
  const lockAcquiredAt = Date.now();

  let store: ReminderStore;
  try {
    store = await readStore();
  } catch (err) {
    await releaseLock(lockToken);
    throw err;
  }

  // We hold the lock for the entire dispatch run so that a concurrent
  // registerReminderSubscription cannot clobber our history writes.
  // The lock TTL (30 s) is intentionally generous; if the dispatch takes
  // longer than expected, we renew the lock periodically. If renewal fails
  // or the lock has expired, we abort to avoid writing a stale snapshot.
  try {
    const sentCount = { sent: 0, skipped: 0 };
    const errors: string[] = [];

    const subscriptions = Object.values(store.subscriptions);
    const client = getSoroWillClient();

    for (const subscription of subscriptions) {
      // Renew lock if we are approaching the TTL threshold.
      const elapsedSeconds = (Date.now() - lockAcquiredAt) / 1000;
      if (elapsedSeconds > KV_LOCK_TTL_SECONDS - KV_LOCK_RENEW_THRESHOLD_SECONDS) {
        const renewed = await renewLock(lockKey);
        if (!renewed) {
          console.warn('[reminders] Lock renewal failed; aborting dispatch to avoid stale writes.');
          break;
        }
      }

      try {
        if (!subscription.confirmed) {
          sentCount.skipped += 1;
          continue;
        }

        const will = await client.getWill(subscription.willId);
        if (will.status !== WillStatus.Active) {
          sentCount.skipped += 1;
          continue;
        }

        const deadline = nextCheckinDeadline(will);
        const remainingMs = deadline.getTime() - Date.now();
        if (remainingMs <= 0) {
          sentCount.skipped += 1;
          continue;
        }

        const daysRemaining = remainingMs / 86_400_000;
        const reminderKind = getReminderKind(daysRemaining);

        const historyKey = getHistoryKey(subscription.willId, subscription.email);
        const historyEntry = store.history[historyKey] ?? {
          willId: subscription.willId,
          email: subscription.email,
        };

        const alreadySent =
          reminderKind === 'imminent' ? Boolean(historyEntry.imminentSentAt) : Boolean(historyEntry.wellBeforeSentAt);
        if (alreadySent) {
          sentCount.skipped += 1;
          continue;
        }

        await sendReminderEmail({
          to: subscription.email,
          will,
          deadline,
          reminderKind,
        });

        if (reminderKind === 'imminent') {
          historyEntry.imminentSentAt = new Date().toISOString();
        } else {
          historyEntry.wellBeforeSentAt = new Date().toISOString();
        }

        store.history[historyKey] = historyEntry;

        // Re-read the latest store and merge our history changes before writing.
        // This prevents clobbering concurrent register/unsubscribe changes that
        // happened while we were sending the email above.
        try {
          const latestStore = await readStore();
          const latestHistory = latestStore.history ?? {};
          const mergedHistory = { ...latestHistory, [historyKey]: historyEntry };

          await writeStore({
            subscriptions: latestStore.subscriptions,
            history: mergedHistory,
          });
        } catch (mergeErr) {
          console.warn('[reminders] Failed to merge store during dispatch, falling back to local snapshot:', mergeErr);
          await writeStore(store);
        }

        sentCount.sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown reminder error';
        errors.push(`${subscription.email}: ${message}`);
      }
    }

    return { sent: sentCount.sent, skipped: sentCount.skipped, errors };
  } finally {
    await releaseLock(lockToken);
  }
}

interface ReminderEmailPayload {
  to: string;
  will: Will;
  deadline: Date;
  reminderKind: ReminderKind;
}

async function sendReminderEmail({ to, will, deadline, reminderKind }: ReminderEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.info(`[reminders] Skipping email for ${to}; provider not configured.`);
    return;
  }

  const subject =
    reminderKind === 'imminent'
      ? 'Your SoroWill check-in deadline is approaching'
      : 'Reminder: your SoroWill check-in is still due soon';

  const days = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86_400_000));
  const unsubscribeUrl = `${getAppBaseUrl()}/api/reminders/unsubscribe?willId=${encodeURIComponent(will.id)}&email=${encodeURIComponent(to)}`;
  const body = `Hello,\n\nThis is a reminder from SoroWill that your will #${will.id} needs a check-in soon. Your next deadline is ${deadline.toISOString()}. There are ${days} day(s) left before the check-in window closes.\n\nPlease visit the app and confirm you are still active to keep the will intact.\n\nTo stop receiving these reminders for this will, visit: ${unsubscribeUrl}\n\nSoroWill`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br />')}</p>`,
    }),
  });

  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${fallback}`);
  }
}

async function sendConfirmationEmail({
  to,
  appUrl,
  token,
}: {
  to: string;
  appUrl: string;
  token: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.info(`[reminders] Skipping confirmation email for ${to}; provider not configured.`);
    return;
  }

  const confirmUrl = `${appUrl}/api/reminders/confirm?token=${encodeURIComponent(token)}`;
  const body = `Hello,\n\nPlease confirm you'd like to receive SoroWill check-in reminders by visiting the link below:\n\n${confirmUrl}\n\nIf you didn't request this, you can ignore this email.\n\nSoroWill`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: 'Confirm your SoroWill reminder subscription',
      text: body,
      html: `<p>${body.replace(/\n/g, '<br />')}</p>`,
    }),
  });

  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${fallback}`);
  }
}
