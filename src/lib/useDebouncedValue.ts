'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `value` once it has stopped changing for `delayMs`. Use it to keep
 * expensive work (RPC calls, searches) from running on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
