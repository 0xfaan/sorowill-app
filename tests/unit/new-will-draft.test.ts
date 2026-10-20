import { describe, expect, it } from 'vitest';
import { isValidDraft } from '@/app/will/new/page';
describe('new will draft validation', () => { it('rejects corrupted or partial drafts', () => { expect(isValidDraft({ step: 0 })).toBe(false); expect(isValidDraft({ step: 0, token: '', amount: '', beneficiaries: [], checkinPeriodDays: 90, gracePeriodDays: 7, guardians: [] })).toBe(true); }); });
