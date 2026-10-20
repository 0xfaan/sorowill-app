import type { SoroWillClient, Will } from '@sorowill/sdk'

// The real SDK constructor must never run when a client is injected.
const { SoroWillClientCtor } = vi.hoisted(() => ({ SoroWillClientCtor: vi.fn() }))
vi.mock('@sorowill/sdk', () => ({ SoroWillClient: SoroWillClientCtor }))

import { enumerateAllWills, getSoroWillClient, getWillsByGuardian } from '@/lib/sorowill'

const GUARDIAN = 'GGUARDIANADDRESS'

/** Builds a typed fake client; only the methods under test need implementing. */
function makeFakeClient(wills: Record<string, Partial<Will>>): SoroWillClient {
  const fake: Pick<SoroWillClient, 'getWill'> = {
    getWill: vi.fn(async (id: string) => {
      const will = wills[id]
      if (!will) throw new Error('will not found')
      return { id, ...will } as Will
    }),
  }
  return fake as SoroWillClient
}

describe('getSoroWillClient dependency injection (Issue #392)', () => {
  it('returns the injected client without constructing the singleton', () => {
    const fake = makeFakeClient({})
    expect(getSoroWillClient({ client: fake })).toBe(fake)
    expect(SoroWillClientCtor).not.toHaveBeenCalled()
  })

  it('getWillsByGuardian uses the injected client', async () => {
    const fake = makeFakeClient({
      '1': { guardians: [GUARDIAN] },
      '2': { guardians: [] },
    })
    const result = await getWillsByGuardian(GUARDIAN, { client: fake })

    expect(result.wills.map((w) => w.id)).toEqual(['1'])
    expect(result.hasErrors).toBe(false)
    expect(fake.getWill).toHaveBeenCalledWith('1')
    expect(SoroWillClientCtor).not.toHaveBeenCalled()
  })

  it('enumerateAllWills uses the injected client', async () => {
    const fake = makeFakeClient({ '1': {}, '2': {} })
    const wills = await enumerateAllWills({ client: fake })

    expect(wills.map((w) => w.id).sort()).toEqual(['1', '2'])
    expect(SoroWillClientCtor).not.toHaveBeenCalled()
  })
})
