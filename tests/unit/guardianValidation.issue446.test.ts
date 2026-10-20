/**
 * Regression test for #446.
 *
 * `validateGuardians` must reject adding the connected will owner's own
 * address as a guardian. This locks in existing behavior (verified correct
 * in prior review) so a future change to the validation logic cannot
 * silently allow a user to name themselves as their own guardian.
 */
import { describe, it, expect } from 'vitest';
import { validateGuardians, OWNER_AS_GUARDIAN_ERROR } from '@/lib/guardianValidation';

const OWNER = 'GBRT6OQL3NICNKX6FFDVAZ36IABM5EB7HDNRPQ4QEMK4TJAUUMFYNFXB';
const OTHER = 'GDMALMOLFTCHCB74BAEZLLXFXQK57JE4BTFS2C3WJGSVF4637PRHII5S';

describe('validateGuardians — owner address rejection (#446)', () => {
  it('flags a guardian entry that exactly matches the owner address', () => {
    const { rowErrors, topError } = validateGuardians([OWNER], OWNER);
    expect(rowErrors[0]).toBe(OWNER_AS_GUARDIAN_ERROR);
    expect(topError).toBe('Please fix the guardian address errors above before continuing.');
  });

  it('flags the owner address even with surrounding whitespace', () => {
    const { rowErrors } = validateGuardians([` ${OWNER} `], OWNER);
    expect(rowErrors[0]).toBe(OWNER_AS_GUARDIAN_ERROR);
  });

  it('does not flag a different, valid guardian address', () => {
    const { rowErrors, topError } = validateGuardians([OTHER], OWNER);
    expect(rowErrors[0]).toBe('');
    expect(topError).toBeNull();
  });

  it('only flags the matching row when the owner address appears alongside others', () => {
    const { rowErrors } = validateGuardians([OTHER, OWNER], OWNER);
    expect(rowErrors[0]).toBe('');
    expect(rowErrors[1]).toBe(OWNER_AS_GUARDIAN_ERROR);
  });

  it('does not flag anything when no owner address is known', () => {
    const { rowErrors, topError } = validateGuardians([OWNER], null);
    expect(rowErrors[0]).toBe('');
    expect(topError).toBeNull();
  });
});
