import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMounted } from '@/lib/useMounted';

// Regression test for #640: the concern was that useMounted could return a
// stale value on first render (e.g. if it were implemented with a ref that
// is mutated synchronously instead of state driven by useEffect). The
// current implementation uses useState + useEffect, which correctly starts
// `false` on the very first render and flips to `true` only after mount,
// triggering a re-render that consumers can observe.
describe('useMounted (#640)', () => {
  it('returns false on the very first render, then true after mount', async () => {
    const { result } = renderHook(() => useMounted());

    // Immediately after the initial render (before effects have had a
    // chance to flush), the hook must report `false` — never a stale
    // `true` from some cached/ref-based value.
    expect(result.current).toBe(false);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('stays true on subsequent renders once mounted', async () => {
    const { result, rerender } = renderHook(() => useMounted());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    rerender();
    expect(result.current).toBe(true);
  });
});
