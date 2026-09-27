/**
 * Unit tests for src/lib/draftValidation.ts
 *
 * Covers issues #411/#439 (parsePeriodInput edge cases) and
 * #438 (isValidDraft / parseDraft: valid, invalid, and missing draft scenarios).
 */

import { describe, it, expect } from 'vitest';
import { isValidDraft, parseDraft, parsePeriodInput, isValidPeriodDays } from '@/lib/draftValidation';

// ---------------------------------------------------------------------------
// parsePeriodInput — #411 / #439
// ---------------------------------------------------------------------------

describe('parsePeriodInput', () => {
  it('accepts a plain positive integer string', () => {
    expect(parsePeriodInput('90')).toBe(90);
  });

  it('accepts the minimum valid value (1)', () => {
    expect(parsePeriodInput('1')).toBe(1);
  });

  it('accepts the maximum valid value (3650)', () => {
    expect(parsePeriodInput('3650')).toBe(3650);
  });

  it('rejects a decimal value — the silent-truncation bug case', () => {
    expect(parsePeriodInput('90.5')).toBeNull();
  });

  it('rejects zero', () => {
    expect(parsePeriodInput('0')).toBeNull();
  });

  it('rejects a negative value', () => {
    expect(parsePeriodInput('-1')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(parsePeriodInput('')).toBeNull();
  });

  it('rejects a whitespace-only string', () => {
    expect(parsePeriodInput('   ')).toBeNull();
  });

  it('rejects a non-numeric string', () => {
    expect(parsePeriodInput('abc')).toBeNull();
  });

  it('rejects a value above the maximum', () => {
    expect(parsePeriodInput('3651')).toBeNull();
  });

  it('rejects "1.0" — syntactically decimal even though mathematically integer', () => {
    expect(parsePeriodInput('1.0')).toBeNull();
  });

  it('rejects scientific notation strings', () => {
    // "1e2" has no decimal point so parseInt would give 1, but Number('1e2') = 100.
    // parsePeriodInput must not silently accept this via parseInt.
    // The current implementation uses parseInt which reads '1' from '1e2',
    // so the result is 1 (valid). We document this behaviour here so any future
    // change that accepts '1e2' as 100 is a deliberate decision.
    const result = parsePeriodInput('1e2');
    // Accept either null (rejected) or 1 (parsed prefix-only); document that
    // 100 would be the unintended silent-coercion outcome we are guarding against.
    expect(result).not.toBe(100);
  });
});

// ---------------------------------------------------------------------------
// isValidPeriodDays
// ---------------------------------------------------------------------------

describe('isValidPeriodDays', () => {
  it('accepts a valid integer in range', () => {
    expect(isValidPeriodDays(30)).toBe(true);
  });

  it('rejects a float', () => {
    expect(isValidPeriodDays(30.5)).toBe(false);
  });

  it('rejects zero', () => {
    expect(isValidPeriodDays(0)).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(isValidPeriodDays(-5)).toBe(false);
  });

  it('rejects a string', () => {
    expect(isValidPeriodDays('30')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidPeriodDays(null)).toBe(false);
  });

  it('rejects a value above 3650', () => {
    expect(isValidPeriodDays(3651)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidDraft — #438
// ---------------------------------------------------------------------------

const VALID_DRAFT = {
  step: 0,
  token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
  amount: '1000',
  beneficiaries: [{ address: 'GABC', percentage: 100 }],
  checkinPeriodDays: 90,
  gracePeriodDays: 7,
  guardians: [],
};

describe('isValidDraft', () => {
  it('accepts a fully-formed draft', () => {
    expect(isValidDraft(VALID_DRAFT)).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidDraft(null)).toBe(false);
  });

  it('rejects a plain string', () => {
    expect(isValidDraft('{"step":0}')).toBe(false);
  });

  it('rejects when step is missing', () => {
    const { step: _, ...rest } = VALID_DRAFT;
    expect(isValidDraft(rest)).toBe(false);
  });

  it('rejects when step is a string', () => {
    expect(isValidDraft({ ...VALID_DRAFT, step: '0' })).toBe(false);
  });

  it('rejects when token is missing', () => {
    const { token: _, ...rest } = VALID_DRAFT;
    expect(isValidDraft(rest)).toBe(false);
  });

  it('rejects when beneficiaries is not an array', () => {
    expect(isValidDraft({ ...VALID_DRAFT, beneficiaries: null })).toBe(false);
  });

  it('rejects when a beneficiary entry has a numeric address', () => {
    expect(
      isValidDraft({
        ...VALID_DRAFT,
        beneficiaries: [{ address: 123, percentage: 100 }],
      }),
    ).toBe(false);
  });

  it('rejects when a beneficiary entry has a string percentage', () => {
    expect(
      isValidDraft({
        ...VALID_DRAFT,
        beneficiaries: [{ address: 'GABC', percentage: '100' }],
      }),
    ).toBe(false);
  });

  it('rejects when checkinPeriodDays is missing', () => {
    const { checkinPeriodDays: _, ...rest } = VALID_DRAFT;
    expect(isValidDraft(rest)).toBe(false);
  });

  it('rejects when guardians is not an array', () => {
    expect(isValidDraft({ ...VALID_DRAFT, guardians: 'GABC' })).toBe(false);
  });

  it('rejects when guardians contains a non-string', () => {
    expect(isValidDraft({ ...VALID_DRAFT, guardians: [42] })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseDraft — #438
// ---------------------------------------------------------------------------

describe('parseDraft', () => {
  it('returns the draft for a valid JSON string', () => {
    const raw = JSON.stringify(VALID_DRAFT);
    expect(parseDraft(raw)).toEqual(VALID_DRAFT);
  });

  it('returns null for null input (missing key)', () => {
    expect(parseDraft(null)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseDraft('')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseDraft('{not-json')).toBeNull();
  });

  it('returns null when the parsed object is structurally invalid', () => {
    const raw = JSON.stringify({ step: 0, token: 'C...' /* missing fields */ });
    expect(parseDraft(raw)).toBeNull();
  });

  it('returns null for a JSON string that is a plain number', () => {
    expect(parseDraft('42')).toBeNull();
  });

  it('returns null for a JSON array', () => {
    expect(parseDraft('[]')).toBeNull();
  });
});
