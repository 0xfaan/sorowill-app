import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';

// Regression coverage for #637: the keydown listener registered by
// useKeyboardShortcuts must be removed exactly once on unmount, and must
// never accumulate duplicate listeners across repeated mount/unmount
// cycles (e.g. navigating between pages that each mount the hook).
describe('useKeyboardShortcuts cleanup (#637)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes its keydown listener exactly once on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts({ onNewWill: vi.fn() }));

    unmount();

    const keydownRemovals = removeSpy.mock.calls.filter(([type]) => type === 'keydown');
    expect(keydownRemovals).toHaveLength(1);
  });

  it('does not leave a stale listener behind after several mount/unmount cycles', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    for (let i = 0; i < 5; i++) {
      const { unmount } = renderHook(() => useKeyboardShortcuts({ onNewWill: vi.fn() }));
      unmount();
    }

    const adds = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;
    const removes = removeSpy.mock.calls.filter(([type]) => type === 'keydown').length;

    // Each cycle adds one and removes one -- never more adds than removes,
    // which is what a leaked/duplicated listener would look like.
    expect(adds).toBe(5);
    expect(removes).toBe(5);
  });

  it('stops invoking the handler for events dispatched after unmount', () => {
    const onNewWill = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ onNewWill }));

    unmount();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));

    expect(onNewWill).not.toHaveBeenCalled();
  });
});
