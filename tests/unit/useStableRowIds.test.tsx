import { StrictMode, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { useStableRowIds } from '@/lib/useStableRowIds';

const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

describe('useStableRowIds (#304)', () => {
  it('assigns an id to every row on the first render', () => {
    const { result } = renderHook(() => useStableRowIds(3), { wrapper });
    expect([0, 1, 2].every((i) => typeof result.current.get(i) === 'string')).toBe(true);
    expect(new Set(result.current.values()).size).toBe(3);
  });

  it('keeps ids stable across re-renders and preserves them when rows are added', () => {
    const { result, rerender } = renderHook(({ count }) => useStableRowIds(count), {
      wrapper,
      initialProps: { count: 2 },
    });
    const first = result.current.get(0);
    const second = result.current.get(1);

    rerender({ count: 2 });
    expect(result.current.get(0)).toBe(first);
    expect(result.current.get(1)).toBe(second);

    rerender({ count: 3 });
    expect(result.current.get(0)).toBe(first);
    expect(result.current.get(1)).toBe(second);
    expect(result.current.get(2)).toEqual(expect.any(String));

    const third = result.current.get(2);
    rerender({ count: 3 });
    expect(result.current.get(2)).toBe(third);
  });

  it('does not log React render-phase update warnings under StrictMode', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = renderHook(({ count }) => useStableRowIds(count), { wrapper, initialProps: { count: 1 } });
    rerender({ count: 2 });
    rerender({ count: 1 });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
