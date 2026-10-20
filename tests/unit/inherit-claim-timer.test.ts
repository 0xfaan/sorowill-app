import { describe, expect, it } from 'vitest';
import { claimIsAvailable } from '@/app/inherit/[id]/InheritPageClient';
import { WillStatus } from '@sorowill/sdk';
describe('inheritance claim timing', () => { it('becomes available at the grace deadline', () => { const deadline = new Date(Date.now() + 1000); expect(claimIsAvailable(WillStatus.Triggered, deadline, deadline.getTime() - 1)).toBe(false); expect(claimIsAvailable(WillStatus.Triggered, deadline, deadline.getTime())).toBe(true); }); });
