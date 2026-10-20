import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classifyCloneError, formatError, isWillNotFoundError, isWillNotFoundMessage } from './errors';

// Suppress console.error noise during these tests.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('formatError', () => {
  describe('known error patterns', () => {
    it('returns a network message for fetch-related errors', () => {
      expect(formatError(new Error('network error'))).toBe(
        'Unable to reach the blockchain network. Please check your connection and try again.',
      );
      expect(formatError(new Error('Failed to fetch'))).toBe(
        'Unable to reach the blockchain network. Please check your connection and try again.',
      );
    });

    it('returns a will-not-found message when the RPC reports code #1', () => {
      expect(formatError(new Error('error(contract, #1)'))).toBe(
        'This will was not found on the blockchain.',
      );
      expect(formatError(new Error('will not found'))).toBe(
        'This will was not found on the blockchain.',
      );
    });

    it('returns an insufficient-funds message for balance errors', () => {
      expect(formatError(new Error('insufficient balance'))).toBe(
        'There are not enough funds to complete this operation.',
      );
    });

    it('returns an already-voted message', () => {
      expect(formatError(new Error('already voted'))).toBe(
        "You've already cast a vote on this will.",
      );
    });

    it('returns an unauthorized message', () => {
      expect(formatError(new Error('unauthorized'))).toBe(
        'You do not have permission to perform this action.',
      );
    });
  });

  describe('non-Error throws (SDK may throw plain objects or strings)', () => {
    it('handles a plain object with a .message property that matches a pattern', () => {
      const sdkError = { message: 'network timeout during fetch', code: 503 };
      expect(formatError(sdkError)).toBe(
        'Unable to reach the blockchain network. Please check your connection and try again.',
      );
    });

    it('handles a plain object with a .message matching will-not-found', () => {
      const sdkError = { message: 'WillNotFound: id 42' };
      expect(formatError(sdkError)).toBe('This will was not found on the blockchain.');
    });

    it('handles a plain string throw that matches a pattern', () => {
      expect(formatError('network unreachable')).toBe(
        'Unable to reach the blockchain network. Please check your connection and try again.',
      );
    });

    it('returns the generic fallback for a plain object with no known pattern (production)', () => {
      // An unrecognised error with no matching pattern always returns the safe fallback.
      expect(formatError({ message: 'xdr_invalid_something' })).toBe(
        'Something went wrong. Please try again later.',
      );
    });

    it('returns the generic fallback for null', () => {
      expect(formatError(null)).toBe('Something went wrong. Please try again later.');
    });

    it('returns the generic fallback for undefined', () => {
      expect(formatError(undefined)).toBe('Something went wrong. Please try again later.');
    });

    it('returns the generic fallback for a number', () => {
      expect(formatError(42)).toBe('Something went wrong. Please try again later.');
    });

    it('never returns [object Object] — always a string', () => {
      const result = formatError({ code: 500, details: { rpc: 'down' } });
      expect(result).not.toContain('[object Object]');
      expect(typeof result).toBe('string');
    });
  });

  describe('always returns a string', () => {
    const inputs: unknown[] = [
      null,
      undefined,
      42,
      '',
      new Error('test'),
      { message: 'test' },
      'test',
      [],
      new TypeError('bad type'),
    ];

    it.each(inputs)('formatError(%o) returns a string', (input) => {
      expect(typeof formatError(input)).toBe('string');
    });
  });

  describe('logs the full error for debugging', () => {
    it('calls console.error with the original error value', () => {
      const sdkError = { message: 'rpc timeout', code: 500 };
      formatError(sdkError);
      expect(console.error).toHaveBeenCalledWith('[SoroWill] SDK/RPC error:', sdkError);
    });

    it('logs Error instances with their full stack', () => {
      const err = new Error('some sdk failure');
      formatError(err);
      expect(console.error).toHaveBeenCalledWith('[SoroWill] SDK/RPC error:', err);
    });
  });
});

describe('isWillNotFoundMessage', () => {
  it('matches "not found"', () => expect(isWillNotFoundMessage('not found')).toBe(true));
  it('matches "WillNotFound"', () => expect(isWillNotFoundMessage('WillNotFound')).toBe(true));
  it('matches "does not exist"', () => expect(isWillNotFoundMessage('does not exist')).toBe(true));
  it('matches "error(contract, #1)"', () =>
    expect(isWillNotFoundMessage('error(contract, #1)')).toBe(true));
  it('does not match unrelated messages', () =>
    expect(isWillNotFoundMessage('insufficient balance')).toBe(false));
});

describe('isWillNotFoundError', () => {
  it('returns true for an Error whose message matches', () => {
    expect(isWillNotFoundError(new Error('will not found on chain'))).toBe(true);
  });
  it('returns false for a plain object (not an Error instance)', () => {
    expect(isWillNotFoundError({ message: 'will not found' })).toBe(false);
  });
  it('returns false for non-Error values', () => {
    expect(isWillNotFoundError('will not found')).toBe(false);
    expect(isWillNotFoundError(null)).toBe(false);
  });
});

describe('classifyCloneError (#441)', () => {
  describe('not_found', () => {
    it('classifies "not found" messages', () => {
      expect(classifyCloneError(new Error('Will not found'))).toBe('not_found');
    });
    it('classifies "WillNotFound" SDK error code', () => {
      expect(classifyCloneError(new Error('WillNotFound: id 99'))).toBe('not_found');
    });
    it('classifies contract error code #1', () => {
      expect(classifyCloneError(new Error('error(contract, #1)'))).toBe('not_found');
    });
    it('classifies "does not exist"', () => {
      expect(classifyCloneError(new Error('will does not exist'))).toBe('not_found');
    });
    it('classifies plain-object SDK throw with not-found message', () => {
      expect(classifyCloneError({ message: 'WillNotFound: id 42' })).toBe('not_found');
    });
  });

  describe('permission', () => {
    it('classifies "unauthorized"', () => {
      expect(classifyCloneError(new Error('unauthorized access'))).toBe('permission');
    });
    it('classifies "permission denied"', () => {
      expect(classifyCloneError(new Error('permission denied'))).toBe('permission');
    });
    it('classifies "access denied"', () => {
      expect(classifyCloneError(new Error('access denied'))).toBe('permission');
    });
    it('classifies "forbidden"', () => {
      expect(classifyCloneError(new Error('forbidden'))).toBe('permission');
    });
    it('classifies "not allowed"', () => {
      expect(classifyCloneError(new Error('action not allowed'))).toBe('permission');
    });
    it('classifies plain-object SDK throw with permission message', () => {
      expect(classifyCloneError({ message: 'unauthorized', code: 403 })).toBe('permission');
    });
  });

  describe('network', () => {
    it('classifies "Failed to fetch"', () => {
      expect(classifyCloneError(new Error('Failed to fetch'))).toBe('network');
    });
    it('classifies "network error"', () => {
      expect(classifyCloneError(new Error('network error'))).toBe('network');
    });
    it('classifies "timeout"', () => {
      expect(classifyCloneError(new Error('request timeout'))).toBe('network');
    });
    it('classifies plain-object SDK throw with network message', () => {
      expect(classifyCloneError({ message: 'fetch failed', code: 503 })).toBe('network');
    });
  });

  describe('unknown', () => {
    it('classifies unrecognised Error messages as unknown', () => {
      expect(classifyCloneError(new Error('xdr_decode_panic'))).toBe('unknown');
    });
    it('classifies null as unknown', () => {
      expect(classifyCloneError(null)).toBe('unknown');
    });
    it('classifies undefined as unknown', () => {
      expect(classifyCloneError(undefined)).toBe('unknown');
    });
    it('classifies a number as unknown', () => {
      expect(classifyCloneError(42)).toBe('unknown');
    });
    it('classifies a plain object with no recognised message as unknown', () => {
      expect(classifyCloneError({ code: 500 })).toBe('unknown');
    });
  });

  describe('priority — not_found beats permission and network', () => {
    it('returns not_found when the message contains both "not found" and "network"', () => {
      expect(classifyCloneError(new Error('will not found on network'))).toBe('not_found');
    });
  });
});
