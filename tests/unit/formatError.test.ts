import { describe, it, expect } from 'vitest';
import { formatError, isWillNotFoundMessage, isWillNotFoundError } from '@/lib/errors';

describe('formatError and error classification (#67, #68, #70, #147, #148, #188, #189, #190)', () => {
  it('correctly classifies contract not found before will not found (#188)', () => {
    const error = new Error('Smart contract not found on the network');
    expect(formatError(error)).toBe('The smart contract could not be found on the network.');
  });

  it('correctly classifies will not found (#190)', () => {
    const error = new Error('WillNotFound: error(contract, #1)');
    expect(formatError(error)).toBe('This will was not found on the blockchain.');
    expect(isWillNotFoundError(error)).toBe(true);
    expect(isWillNotFoundMessage(error.message)).toBe(true);
  });

  it('distinguishes already voted from not a guardian (#189)', () => {
    const alreadyVoted = new Error('Guardian has already voted');
    expect(formatError(alreadyVoted)).toBe("You've already cast a vote on this will.");

    const notGuardian = new Error('Account is not a guardian on this will');
    expect(formatError(notGuardian)).toBe('You are not eligible to perform this action on this will.');
  });

  it('classifies network and simulation errors', () => {
    const networkError = new Error('Failed to fetch from RPC');
    expect(formatError(networkError)).toBe(
      'Unable to reach the blockchain network. Please check your connection and try again.',
    );

    const simulationError = new Error('Host simulation failed');
    expect(formatError(simulationError)).toBe(
      'The transaction simulation failed. The will may no longer be in a state that allows this action.',
    );
  });

  it('falls back gracefully to friendly message for unknown errors (#70)', () => {
    const unknownError = new Error('random internal panic');
    expect(formatError(unknownError)).toBe('Something went wrong. Please try again later.');
  });
});
