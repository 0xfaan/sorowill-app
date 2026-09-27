/**
 * Runtime validation for the NewWill localStorage draft.
 *
 * We intentionally avoid a third-party schema library so as not to add a new
 * dependency.  The schema mirrors the `FormState` interface in
 * `src/app/will/new/page.tsx` exactly.
 */

import type { Beneficiary } from '@sorowill/sdk';

export interface FormStateDraft {
  step: number;
  token: string;
  amount: string;
  beneficiaries: Beneficiary[];
  checkinPeriodDays: number;
  gracePeriodDays: number;
  guardians: string[];
}

function isBeneficiary(value: unknown): value is Beneficiary {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.address === 'string' && typeof obj.percentage === 'number';
}

/**
 * Returns true when `value` is a fully-formed, structurally valid FormStateDraft.
 * Individual field semantics (e.g. address format, period range) are validated
 * by the form itself; this check only guards against corrupted / stale shapes.
 */
export function isValidDraft(value: unknown): value is FormStateDraft {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.step !== 'number') return false;
  if (typeof obj.token !== 'string') return false;
  if (typeof obj.amount !== 'string') return false;
  if (!Array.isArray(obj.beneficiaries)) return false;
  if (!obj.beneficiaries.every(isBeneficiary)) return false;
  if (typeof obj.checkinPeriodDays !== 'number') return false;
  if (typeof obj.gracePeriodDays !== 'number') return false;
  if (!Array.isArray(obj.guardians)) return false;
  if (!obj.guardians.every((g: unknown) => typeof g === 'string')) return false;

  return true;
}

/**
 * Parses a raw JSON string from localStorage and validates it.
 *
 * Returns the parsed draft on success, or `null` if the string is absent,
 * malformed JSON, or fails the structural check.
 */
export function parseDraft(raw: string | null): FormStateDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraft(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Period-value helpers (shared between the form and unit tests)
// ---------------------------------------------------------------------------

/** True when `days` is a safe positive integer within the allowed range. */
export function isValidPeriodDays(days: unknown): days is number {
  if (typeof days !== 'number') return false;
  if (!Number.isInteger(days)) return false;
  if (days < 1) return false;
  if (days > 3650) return false;
  return true;
}

/**
 * Coerces a raw input string to a positive integer period value.
 *
 * Returns the integer on success or `null` if the value is blank, non-numeric,
 * decimal, zero, negative, or out of range.
 */
export function parsePeriodInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  // Reject anything with a decimal point — parseInt('1.5') would silently
  // truncate to 1, which is exactly the silent-truncation bug we are fixing.
  if (raw.includes('.')) return null;
  const value = parseInt(raw, 10);
  if (!isValidPeriodDays(value)) return null;
  return value;
}
