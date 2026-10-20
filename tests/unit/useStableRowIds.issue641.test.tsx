import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStableRowIds } from '@/lib/useStableRowIds';

// Regression test for #641: the concern was that row-id associations could
// drift when the input array's length changes, rather than only when it
// stays the same. This locks in that growing AND shrinking the row count
// both preserve the existing index -> id associations for the indices that
// remain, and that shrinking then growing back restores the original ids
// rather than minting fresh ones for indices that were briefly removed.
describe('useStableRowIds (#641)', () => {
  it('preserves existing index -> id associations when the array grows', () => {
    const { result, rerender } = renderHook(({ count }) => useStableRowIds(count), {
      initialProps: { count: 2 },
    });

    const id0 = result.current.get(0);
    const id1 = result.current.get(1);

    rerender({ count: 5 });

    expect(result.current.get(0)).toBe(id0);
    expect(result.current.get(1)).toBe(id1);
    expect(result.current.get(2)).toEqual(expect.any(String));
    expect(result.current.get(3)).toEqual(expect.any(String));
    expect(result.current.get(4)).toEqual(expect.any(String));
  });

  it('preserves existing index -> id associations when the array shrinks', () => {
    const { result, rerender } = renderHook(({ count }) => useStableRowIds(count), {
      initialProps: { count: 5 },
    });

    const id0 = result.current.get(0);
    const id1 = result.current.get(1);
    const id2 = result.current.get(2);

    rerender({ count: 3 });

    expect(result.current.size).toBe(3);
    expect(result.current.get(0)).toBe(id0);
    expect(result.current.get(1)).toBe(id1);
    expect(result.current.get(2)).toBe(id2);
    expect(result.current.get(3)).toBeUndefined();
    expect(result.current.get(4)).toBeUndefined();
  });

  it('restores original ids for indices re-grown after shrinking', () => {
    const { result, rerender } = renderHook(({ count }) => useStableRowIds(count), {
      initialProps: { count: 3 },
    });

    const originalId2 = result.current.get(2);

    rerender({ count: 1 });
    expect(result.current.get(2)).toBeUndefined();

    rerender({ count: 3 });
    expect(result.current.get(2)).toBe(originalId2);
  });
});
