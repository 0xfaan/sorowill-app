import { describe, expect, it } from 'vitest';
import { shouldReplaceBeneficiaryDraft } from '@/app/will/[id]/page';
describe('beneficiary draft refresh behavior', () => { it('preserves drafts while editing', () => { expect(shouldReplaceBeneficiaryDraft(true)).toBe(false); expect(shouldReplaceBeneficiaryDraft(false)).toBe(true); }); });
