'use client';

import { useId, useMemo } from 'react';

/**
 * Returns a map of row index -> id that stays the same for as long as the
 * component is mounted.
 *
 * Ids are derived purely from `useId()` and the row index, so rendering never
 * updates state (Rules of React). This matches the previous behaviour, where
 * an index kept its id for the component's lifetime once assigned.
 */
export function useStableRowIds(count: number): Map<number, string> {
  const prefix = useId();
  return useMemo(() => {
    const ids = new Map<number, string>();
    for (let index = 0; index < count; index++) {
      ids.set(index, `${prefix}-row-${index}`);
    }
    return ids;
  }, [prefix, count]);
}
