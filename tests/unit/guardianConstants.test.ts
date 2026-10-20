import { describe, it, expect } from 'vitest';
import { MAX_GUARDIANS, GUARDIAN_THRESHOLD } from '@/lib/constants';

describe('Guardian constants (#59, #141, #143, #144, #196, #201, #203, #238, #257)', () => {
  it('defines unified MAX_GUARDIANS as 3', () => {
    expect(MAX_GUARDIANS).toBe(3);
  });

  it('defines unified GUARDIAN_THRESHOLD as 2', () => {
    expect(GUARDIAN_THRESHOLD).toBe(2);
  });
});
