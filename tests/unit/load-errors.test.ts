import { describe, expect, it } from 'vitest';
import { formatLoadError } from '@/lib/errors';
describe('safe data-load errors', () => { it('never exposes SDK details', () => { expect(formatLoadError(new Error('RPC stack trace'))).toBe('Could not load will — check your connection.'); expect(formatLoadError(new Error('permission denied'))).toMatch(/permission/); }); });
