import { type Will } from '@sorowill/sdk';
import { isWillNotFoundMessage } from '@/lib/errors';

/**
 * Time model for deadline math
 *
 * UTC requirement: every deadline is an absolute instant in UTC epoch
 * milliseconds, matching the contract's UTC ledger timestamps. Never derive a
 * deadline from local-time getters/setters (`getDate()`, `setHours()`,
 * `new Date(y, m, d)`, ...) — they depend on the viewer's timezone and would
 * make the remaining time disagree with the contract. Local time may only be
 * used for display. Use `formatDeadlineUtc` to show the deadline in UTC.
 *
 * All deadlines are computed as `instant + days * MS_PER_DAY` on epoch
 * milliseconds, which mirrors the contract (`period_days * 86_400` added to a
 * ledger timestamp in seconds).
 *
 * DST: epoch milliseconds are UTC and have no notion of local time, so a
 * DST transition between the two instants cannot shift the result. A 7-day
 * period that spans a spring-forward change is exactly 7 × 86 400 s later,
 * which renders as 6d 23h or 7d 1h *wall-clock* time in the affected zone —
 * that is intentional, because the contract enforces elapsed seconds, not
 * calendar days. Do not "fix" this with local-time `setDate()` arithmetic;
 * that would diverge from on-chain enforcement by up to an hour.
 *
 * Leap seconds: both JavaScript `Date` and Stellar ledger close times use
 * POSIX/Unix time, in which every day is exactly 86 400 s and leap seconds
 * are not counted (they are smeared or repeated by the OS clock). Because
 * the client and the contract share that model, a leap second can never
 * make the displayed deadline disagree with the on-chain one. The only
 * observable effect is that around a leap second the true elapsed SI time
 * may differ from the computed duration by ±1 s, which is well below the
 * granularity this app displays. No leap second is scheduled; the IERS
 * intends to abolish them by 2035.
 */
const MS_PER_DAY = 86_400 * 1000;

function addDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * MS_PER_DAY);
}

/** Formats a deadline as an unambiguous UTC string, e.g. "2026-01-08 12:00 UTC". */
export function formatDeadlineUtc(deadline: Date): string {
  return `${deadline.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function nextCheckinDeadline(will: Will): Date {
  return addDays(will.lastCheckin, will.checkinPeriodDays);
}

/**
 * Shared check-in deadline helper. `reminders.ts` previously defined its own
 * private `buildDeadline(will)` with the exact same formula; it now imports
 * this helper so reminder emails quote the same deadline the rest of the app
 * displays.
 */
export function buildDeadline(will: Will): Date {
  return nextCheckinDeadline(will);
}

export function graceDeadline(will: Will): Date | null {
  if (!will.triggerTime) {
    return null;
  }
  return addDays(will.triggerTime, will.gracePeriodDays);
}

export enum WillErrorCode {
  NotFound = 'NOT_FOUND',
  Network = 'NETWORK_ERROR',
  Unknown = 'UNKNOWN',
}

export function categorizeWillError(err: unknown): WillErrorCode {
  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();

  if (isWillNotFoundMessage(message)) {
    return WillErrorCode.NotFound;
  }

  if (
    normalized.includes('network') ||
    normalized.includes('timeout') ||
    normalized.includes('fetch') ||
    normalized.includes('simulation failed')
  ) {
    return WillErrorCode.Network;
  }

  return WillErrorCode.Unknown;
}

export function getWillErrorMessage(err: unknown): string {
  const code = categorizeWillError(err);

  switch (code) {
    case WillErrorCode.NotFound:
      return 'This will could not be found. Please check the link and try again.';
    case WillErrorCode.Network:
      return 'Unable to reach the network. Please check your connection and retry.';
    default:
      return err instanceof Error ? err.message : 'Failed to load will';
  }
}

function splitDuration(totalSeconds: number) {
  const clamped = Math.max(totalSeconds, 0);
  const days = Math.floor(clamped / 86_400);
  const hours = Math.floor((clamped % 86_400) / 3_600);
  const minutes = Math.floor((clamped % 3_600) / 60);
  const seconds = Math.floor(clamped % 60);
  return { days, hours, minutes, seconds };
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatCheckinCountdown(secondsLeft: number, overdueLabel = false): string {
  if (overdueLabel && secondsLeft <= 0) {
    return 'Overdue — 00:00:00:00';
  }
  const { days, hours, minutes, seconds } = splitDuration(secondsLeft);
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatCheckinLabel(secondsLeft: number): string {
  if (secondsLeft <= 0) {
    return 'Check-in overdue';
  }

  if (secondsLeft < 86_400) {
    const { hours, minutes } = splitDuration(secondsLeft);
    if (hours > 0) {
      return `Check-in due in ${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `Check-in due in ${minutes}m`;
    }
    return 'Check-in due in under 1m';
  }

  const daysLeft = Math.floor(secondsLeft / 86_400);
  return `Check-in due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
}
