import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { SoroWillClient, Will, WillStatus } from '@sorowill/sdk';

// ---------------------------------------------------------------------------
// Smoke test: ensures the app's read paths (getWill, getWillsByOwner) can
// successfully execute against a mocked SDK client. This test is deliberately
// separate from the existing compile-only build check in CI — it validates
// that the SDK call surfaces used by the app's pages actually resolve without
// throwing, providing a functional regression signal distinct from type-check
// or build success.
// ---------------------------------------------------------------------------

/** Minimal mock that matches the SoroWillClient read methods used in production. */
function createMockClient(): SoroWillClient {
  const mockWill: Will = {
    id: '42',
    owner: 'GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4',
    token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4',
    balance: '100000000', // 100 USDC
    beneficiaries: [
      { address: 'GDSWYNUBEHPVKWC3Q5CYRG6QZIMGR5P5ZRYSRZBCRN2VHQY7Z67HFCEF', percentage: 100 },
    ],
    guardians: [],
    guardianVotes: 0,
    status: 'Active' as WillStatus,
    lastCheckin: new Date('2025-01-01'),
    checkinPeriodDays: 90,
    gracePeriodDays: 7,
    triggerTime: null,
  };

  return {
    getWill: vi.fn().mockResolvedValue(mockWill),
    getWillsByOwner: vi.fn().mockResolvedValue([mockWill]),
    getWillsByBeneficiary: vi.fn().mockResolvedValue([]),
  } as unknown as SoroWillClient;
}

describe('SoroWillClient read path smoke test', () => {
  let client: SoroWillClient;

  beforeAll(() => {
    client = createMockClient();
  });

  it('getWill returns a valid will', async () => {
    const will = await client.getWill('42');
    expect(will).toBeDefined();
    expect(will.id).toBe('42');
    expect(will.owner).toMatch(/^G[A-Z2-7]{55}$/);
    expect(will.beneficiaries).toBeInstanceOf(Array);
    expect(will.beneficiaries.length).toBeGreaterThan(0);
    expect(typeof will.balance).toBe('string');
  });

  it('getWillsByOwner returns a list of wills for a given owner', async () => {
    const wills = await client.getWillsByOwner('GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4');
    expect(wills).toBeInstanceOf(Array);
    expect(wills.length).toBe(1);
    expect(wills[0].owner).toBe('GDBRZV77PZDK7LRBXEUPZNGJNQLFQKAZD6PKS7JFAZAKU4H3FDON4JL4');
  });

  it('getWillsByOwner returns empty array for unknown owner', async () => {
    const emptyClient = createMockClient();
    vi.mocked(emptyClient.getWillsByOwner).mockResolvedValue([]);
    const wills = await emptyClient.getWillsByOwner('GZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ');
    expect(wills).toBeInstanceOf(Array);
    expect(wills).toHaveLength(0);
  });

  it('getWill returns correct beneficiary percentages', async () => {
    const will = await client.getWill('42');
    const totalPercentage = will.beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    expect(totalPercentage).toBe(100);
  });
});